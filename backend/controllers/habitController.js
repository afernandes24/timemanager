// Kontroler nawyków – lista nawyków, odznaczanie wykonania, historia
const pool = require("../config/db");
const { validateHabit, validateHabitLog } = require("../models/Habit");
const { isDate, has } = require("../models/validators");

// Dodanie n dni do daty w formacie RRRR-MM-DD (bez wpływu stref czasowych)
const shiftDate = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Uzupełnia nawyk o: stan na dany dzień, historię 7 dni i serię dni z rzędu
function withProgress(habit, doneDates, date) {
  const history = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = shiftDate(date, -i);
    history.push({ date: day, completed: doneDates.has(day) });
  }
  let streak = 0;
  let cursor = doneDates.has(date) ? date : shiftDate(date, -1);
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return {
    ...habit,
    completed: doneDates.has(date),
    history,
    streak,
    week_done: history.filter((h) => h.completed).length,
  };
}

// GET /api/habits?date=RRRR-MM-DD
const getHabits = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ message: "Podaj datę w formacie RRRR-MM-DD" });

    const habits = await pool.query("SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at, id", [req.userId]);
    const logs = await pool.query(
      `SELECT l.habit_id, l.date FROM habit_logs l
       JOIN habits h ON h.id = l.habit_id
       WHERE h.user_id = $1 AND l.completed AND l.date BETWEEN $2::date - 90 AND $2::date`,
      [req.userId, date]
    );

    const byHabit = new Map();
    for (const row of logs.rows) {
      if (!byHabit.has(row.habit_id)) byHabit.set(row.habit_id, new Set());
      byHabit.get(row.habit_id).add(row.date);
    }
    res.json(habits.rows.map((h) => withProgress(h, byHabit.get(h.id) || new Set(), date)));
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania nawyków" });
  }
};

// POST /api/habits
const addHabit = async (req, res) => {
  try {
    const errors = validateHabit(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const { name, description, frequency } = req.body;
    const result = await pool.query(
      "INSERT INTO habits (user_id, name, description, frequency) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.userId, name.trim(), description || null, frequency || "daily"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas dodawania nawyku" });
  }
};

// PUT /api/habits/:id
const updateHabit = async (req, res) => {
  try {
    const errors = validateHabit(req.body, true);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const sets = [];
    const params = [];
    for (const field of ["name", "description", "frequency"]) {
      if (!has(req.body, field)) continue;
      let value = req.body[field];
      if (field === "name") value = value.trim();
      if (field === "description" && value === "") value = null;
      params.push(value);
      sets.push(`${field} = $${params.length}`);
    }
    if (!sets.length) return res.status(400).json({ message: "Brak danych do zmiany" });

    params.push(req.params.id, req.userId);
    const result = await pool.query(
      `UPDATE habits SET ${sets.join(", ")}, updated_at = NOW()
       WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono nawyku" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas edycji nawyku" });
  }
};

// POST /api/habits/:id/log – odznaczenie (lub cofnięcie) wykonania w danym dniu
const logHabit = async (req, res) => {
  try {
    const errors = validateHabitLog(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const owner = await pool.query("SELECT 1 FROM habits WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    if (owner.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono nawyku" });

    const completed = has(req.body, "completed") ? req.body.completed : true;
    const result = await pool.query(
      `INSERT INTO habit_logs (habit_id, date, completed) VALUES ($1, $2, $3)
       ON CONFLICT (habit_id, date)
       DO UPDATE SET completed = EXCLUDED.completed, updated_at = NOW()
       RETURNING *`,
      [req.params.id, req.body.date, completed]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas zapisywania wykonania nawyku" });
  }
};

// DELETE /api/habits/:id
const deleteHabit = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM habits WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono nawyku" });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas usuwania nawyku" });
  }
};

module.exports = { getHabits, addHabit, updateHabit, logHabit, deleteHabit };
