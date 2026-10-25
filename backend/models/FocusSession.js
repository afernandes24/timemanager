// Model encji SesjaSkupienia (tabela focus_sessions)
const { isTimestamp, has } = require("./validators");

// Domyślne długości faz techniki Pomodoro (F. Cirillo)
const POMODORO = { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 };

function validateFocusSession(data) {
  const errors = [];
  if (!isTimestamp(data.start_time)) errors.push("Czas rozpoczęcia sesji ma nieprawidłowy format.");
  if (has(data, "end_time") && data.end_time !== null && !isTimestamp(data.end_time)) {
    errors.push("Czas zakończenia sesji ma nieprawidłowy format.");
  }
  const minutes = Number(data.duration_minutes);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) {
    errors.push("Czas trwania sesji musi być liczbą minut (0–600).");
  }
  if (has(data, "task_id") && data.task_id !== null && !Number.isInteger(Number(data.task_id))) {
    errors.push("Nieprawidłowe zadanie.");
  }
  return errors;
}

module.exports = { POMODORO, validateFocusSession };
