// Kontroler podsumowania – kontrola postępów (zadania, sesje, plan, nawyki)
const pool = require("../config/db");
const { isDate } = require("../models/validators");

// GET /api/summary?date=RRRR-MM-DD
const getSummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isDate(date)) return res.status(400).json({ message: "Podaj datę w formacie RRRR-MM-DD" });
    const params = [req.userId, date];

    // Zadania dnia: z terminem na ten dzień lub zaplanowane w blokach czasu
    const tasks = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
       FROM tasks t
       WHERE t.user_id = $1
         AND (t.due_date = $2 OR EXISTS (
               SELECT 1 FROM time_blocks b WHERE b.task_id = t.id AND b.date = $2))`,
      params
    );

    const sessions = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE completed)::int AS completed,
              COALESCE(SUM(duration_minutes), 0)::int AS minutes
       FROM focus_sessions WHERE user_id = $1 AND start_time::date = $2`,
      params
    );

    const blocks = await pool.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0)::int AS minutes
       FROM time_blocks WHERE user_id = $1 AND date = $2`,
      params
    );

    const habits = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(l.id) FILTER (WHERE l.completed)::int AS done
       FROM habits h
       LEFT JOIN habit_logs l ON l.habit_id = h.id AND l.date = $2
       WHERE h.user_id = $1`,
      params
    );

    const week = await pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS date,
         (SELECT COUNT(*) FROM tasks t WHERE t.user_id = $1 AND t.due_date = d::date AND t.status = 'done')::int AS tasks_done,
         (SELECT COUNT(*) FROM tasks t WHERE t.user_id = $1 AND t.due_date = d::date)::int AS tasks_total,
         (SELECT COALESCE(SUM(s.duration_minutes), 0) FROM focus_sessions s
            WHERE s.user_id = $1 AND s.start_time::date = d::date)::int AS focus_minutes,
         (SELECT COUNT(*) FROM focus_sessions s
            WHERE s.user_id = $1 AND s.start_time::date = d::date AND s.completed)::int AS sessions,
         (SELECT COUNT(*) FROM habit_logs l JOIN habits h ON h.id = l.habit_id
            WHERE h.user_id = $1 AND l.date = d::date AND l.completed)::int AS habits_done
       FROM generate_series($2::date - 6, $2::date, INTERVAL '1 day') AS d
       ORDER BY d`,
      params
    );

    const statuses = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM tasks WHERE user_id = $1 GROUP BY status`,
      [req.userId]
    );

    const t = tasks.rows[0];
    res.json({
      date,
      tasks: t,
      plan_percent: t.total ? Math.round((t.done / t.total) * 100) : 0,
      sessions: sessions.rows[0],
      planned: blocks.rows[0],
      habits: habits.rows[0],
      week: week.rows,
      statuses: Object.fromEntries(statuses.rows.map((r) => [r.status, r.count])),
    });
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas generowania podsumowania" });
  }
};

module.exports = { getSummary };
