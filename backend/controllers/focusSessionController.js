// Kontroler sesji skupienia – rejestrowanie pracy w technice Pomodoro
const pool = require("../config/db");
const { validateFocusSession, POMODORO } = require("../models/FocusSession");
const { isDate } = require("../models/validators");

// GET /api/focus-sessions?date=RRRR-MM-DD
const getFocusSessions = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ message: "Podaj datę w formacie RRRR-MM-DD" });

    const result = await pool.query(
      `SELECT s.*, t.title AS task_title
       FROM focus_sessions s
       LEFT JOIN tasks t ON t.id = s.task_id
       WHERE s.user_id = $1 AND s.start_time::date = $2
       ORDER BY s.start_time`,
      [req.userId, date]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania sesji skupienia" });
  }
};

// GET /api/focus-sessions/settings – długości faz Pomodoro
const getPomodoroSettings = (req, res) => res.json(POMODORO);

// POST /api/focus-sessions – zapis zakończonej (lub przerwanej) sesji
const addFocusSession = async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validateFocusSession(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const { task_id, start_time, end_time, duration_minutes, completed } = req.body;

    if (task_id) {
      const owner = await client.query("SELECT status FROM tasks WHERE id = $1 AND user_id = $2", [task_id, req.userId]);
      if (owner.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono zadania" });
    }

    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO focus_sessions (user_id, task_id, start_time, end_time, duration_minutes, completed)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, task_id || null, start_time, end_time || null, Number(duration_minutes), Boolean(completed)]
    );
    // Rozpoczęcie pracy nad zadaniem zmienia jego status na "w trakcie"
    if (task_id) {
      await client.query(
        "UPDATE tasks SET status = 'in_progress', updated_at = NOW() WHERE id = $1 AND status = 'new'",
        [task_id]
      );
    }
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({ message: "Błąd podczas zapisywania sesji skupienia" });
  } finally {
    client.release();
  }
};

// DELETE /api/focus-sessions/:id
const deleteFocusSession = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM focus_sessions WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono sesji" });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas usuwania sesji" });
  }
};

module.exports = { getFocusSessions, getPomodoroSettings, addFocusSession, deleteFocusSession };
