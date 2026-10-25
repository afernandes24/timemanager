// Kontroler zadań – dodawanie, edycja, usuwanie, zmiana statusu, filtrowanie
const pool = require("../config/db");
const { validateTask, EDITABLE_FIELDS, STATUSES, PRIORITIES } = require("../models/Task");
const { isDate, has } = require("../models/validators");

// Łączny czas zaplanowany dla zadania w blokach czasu (w minutach)
const PLANNED_MINUTES_SQL = `
  COALESCE((
    SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60)::int
    FROM time_blocks b WHERE b.task_id = t.id
  ), 0) AS planned_minutes`;

const SORT_OPTIONS = {
  deadline: "t.due_date ASC NULLS LAST, t.created_at DESC",
  priority: "CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date ASC NULLS LAST",
  created: "t.created_at DESC",
  title: "LOWER(t.title) ASC",
};

// GET /api/tasks?status=&priority=&q=&sort=&inbox=true
const getTasks = async (req, res) => {
  try {
    const { status, priority, q, sort, inbox } = req.query;
    const conditions = ["t.user_id = $1"];
    const params = [req.userId];

    if (status && STATUSES.includes(status)) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (priority && PRIORITIES.includes(priority)) {
      params.push(priority);
      conditions.push(`t.priority = $${params.length}`);
    }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }
    if (inbox === "true") {
      conditions.push("t.due_date IS NULL AND t.status <> 'done'");
    }

    const orderBy = SORT_OPTIONS[sort] || SORT_OPTIONS.deadline;
    const result = await pool.query(
      `SELECT t.*, ${PLANNED_MINUTES_SQL}
       FROM tasks t
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania zadań" });
  }
};

// GET /api/tasks/today?date=RRRR-MM-DD – zadania z terminem na dany dzień
// lub zaplanowane w blokach czasu tego dnia (z godziną pierwszego bloku)
const getTodayTasks = async (req, res) => {
  try {
    const date = req.query.date;
    if (!isDate(date)) return res.status(400).json({ message: "Podaj datę w formacie RRRR-MM-DD" });

    const result = await pool.query(
      `SELECT t.*, ${PLANNED_MINUTES_SQL},
              (SELECT MIN(b.start_time) FROM time_blocks b
                WHERE b.task_id = t.id AND b.date = $2) AS planned_time
       FROM tasks t
       WHERE t.user_id = $1
         AND (t.due_date = $2 OR EXISTS (
               SELECT 1 FROM time_blocks b WHERE b.task_id = t.id AND b.date = $2))
       ORDER BY planned_time ASC NULLS LAST, t.created_at ASC`,
      [req.userId, date]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania zadań na dziś" });
  }
};

// POST /api/tasks – dodanie nowego zadania (Listing 3.1)
const addTask = async (req, res) => {
  try {
    const { title, description, deadline, priority } = req.body;

    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const result = await pool.query(
      "INSERT INTO tasks (user_id, title, description, due_date, priority, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.userId, title.trim(), description || null, deadline || null, priority || "medium", "new"]
    );
    res.status(201).json({ ...result.rows[0], planned_minutes: 0 });
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas dodawania zadania" });
  }
};

// PUT /api/tasks/:id – edycja zadania (zmieniane są tylko przesłane pola)
const updateTask = async (req, res) => {
  try {
    const errors = validateTask(req.body, true);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const sets = [];
    const params = [];
    for (const [field, column] of Object.entries(EDITABLE_FIELDS)) {
      if (!has(req.body, field)) continue;
      let value = req.body[field];
      if (field === "title") value = value.trim();
      if ((field === "deadline" || field === "description") && value === "") value = null;
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
    if (!sets.length) return res.status(400).json({ message: "Brak danych do zmiany" });

    params.push(req.params.id, req.userId);
    const result = await pool.query(
      `UPDATE tasks SET ${sets.join(", ")}, updated_at = NOW()
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono zadania" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas edycji zadania" });
  }
};

// PATCH /api/tasks/:id/status – zmiana statusu (new / in_progress / done)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: "Nieprawidłowy status" });

    const result = await pool.query(
      "UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
      [status, req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono zadania" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas zmiany statusu" });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono zadania" });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas usuwania zadania" });
  }
};

module.exports = { getTasks, getTodayTasks, addTask, updateTask, updateTaskStatus, deleteTask };
