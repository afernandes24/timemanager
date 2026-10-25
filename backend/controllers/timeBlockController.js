// Kontroler bloków czasu – planowanie dnia metodą time blocking
const pool = require("../config/db");
const { validateTimeBlock, validateRange, EDITABLE_FIELDS } = require("../models/TimeBlock");
const { isDate, has } = require("../models/validators");

const BLOCK_SELECT = `
  SELECT b.id, b.user_id, b.task_id, b.label, b.date,
         to_char(b.start_time, 'HH24:MI') AS start_time,
         to_char(b.end_time, 'HH24:MI')   AS end_time,
         b.created_at, b.updated_at,
         t.title AS task_title, t.status AS task_status, t.priority AS task_priority
  FROM time_blocks b
  LEFT JOIN tasks t ON t.id = b.task_id`;

// Czy w danym dniu istnieje blok nachodzący na podany przedział?
async function findOverlap(userId, date, start, end, excludeId = null) {
  const result = await pool.query(
    `SELECT id, COALESCE(label, '') AS label, to_char(start_time, 'HH24:MI') AS start_time,
            to_char(end_time, 'HH24:MI') AS end_time
     FROM time_blocks
     WHERE user_id = $1 AND date = $2 AND start_time < $4 AND end_time > $3
       AND ($5::int IS NULL OR id <> $5)
     LIMIT 1`,
    [userId, date, start, end, excludeId]
  );
  return result.rows[0] || null;
}

async function ensureTaskOwner(userId, taskId) {
  if (taskId === null || taskId === undefined || taskId === "") return true;
  const r = await pool.query("SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2", [taskId, userId]);
  return r.rowCount > 0;
}

const overlapMessage = (b) =>
  `Blok koliduje z innym blokiem (${b.start_time}–${b.end_time}${b.label ? `: ${b.label}` : ""}).`;

// GET /api/time-blocks?date=RRRR-MM-DD
const getTimeBlocks = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ message: "Podaj datę w formacie RRRR-MM-DD" });

    const result = await pool.query(`${BLOCK_SELECT} WHERE b.user_id = $1 AND b.date = $2 ORDER BY b.start_time`, [
      req.userId,
      date,
    ]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania planu dnia" });
  }
};

// POST /api/time-blocks – przypisanie zadania do przedziału czasu
const addTimeBlock = async (req, res) => {
  try {
    const errors = validateTimeBlock(req.body);
    const { task_id, label, date, start_time, end_time } = req.body;
    if (!errors.length) {
      const rangeError = validateRange(start_time, end_time);
      if (rangeError) errors.push(rangeError);
    }
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    if (!(await ensureTaskOwner(req.userId, task_id))) {
      return res.status(404).json({ message: "Nie znaleziono zadania" });
    }
    const overlap = await findOverlap(req.userId, date, start_time, end_time);
    if (overlap) return res.status(409).json({ message: overlapMessage(overlap) });

    const inserted = await pool.query(
      `INSERT INTO time_blocks (user_id, task_id, label, date, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.userId, task_id || null, label ? label.trim() : null, date, start_time, end_time]
    );
    const result = await pool.query(`${BLOCK_SELECT} WHERE b.id = $1`, [inserted.rows[0].id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas dodawania bloku czasu" });
  }
};

// PUT /api/time-blocks/:id – przesuwanie, skracanie, wydłużanie, zmiana zadania
const updateTimeBlock = async (req, res) => {
  try {
    const errors = validateTimeBlock(req.body, true);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const current = await pool.query(
      `SELECT task_id, label, date, to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time, 'HH24:MI') AS end_time
       FROM time_blocks WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (current.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono bloku czasu" });

    const merged = { ...current.rows[0] };
    for (const field of EDITABLE_FIELDS) if (has(req.body, field)) merged[field] = req.body[field];
    if (merged.task_id === "") merged.task_id = null;
    if (typeof merged.label === "string") merged.label = merged.label.trim() || null;

    const rangeError = validateRange(merged.start_time, merged.end_time);
    if (rangeError) return res.status(400).json({ message: rangeError });
    if (!merged.task_id && !merged.label) {
      return res.status(400).json({ message: "Blok musi mieć przypisane zadanie lub nazwę." });
    }
    if (!(await ensureTaskOwner(req.userId, merged.task_id))) {
      return res.status(404).json({ message: "Nie znaleziono zadania" });
    }
    const overlap = await findOverlap(req.userId, merged.date, merged.start_time, merged.end_time, Number(req.params.id));
    if (overlap) return res.status(409).json({ message: overlapMessage(overlap) });

    await pool.query(
      `UPDATE time_blocks
       SET task_id = $1, label = $2, date = $3, start_time = $4, end_time = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7`,
      [merged.task_id || null, merged.label, merged.date, merged.start_time, merged.end_time, req.params.id, req.userId]
    );
    const result = await pool.query(`${BLOCK_SELECT} WHERE b.id = $1`, [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas edycji bloku czasu" });
  }
};

// DELETE /api/time-blocks/:id
const deleteTimeBlock = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM time_blocks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Nie znaleziono bloku czasu" });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas usuwania bloku czasu" });
  }
};

module.exports = { getTimeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock };
