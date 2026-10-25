// Model encji Nawyk (tabele habits i habit_logs)
const { isNonEmptyText, isDate, has } = require("./validators");

const FREQUENCIES = ["daily", "weekdays", "weekly"];

function validateHabit(data, partial = false) {
  const errors = [];
  if (!partial || has(data, "name")) {
    if (!isNonEmptyText(data.name, 120)) errors.push("Nazwa nawyku jest wymagana (max 120 znaków).");
  }
  if (has(data, "frequency") && !FREQUENCIES.includes(data.frequency)) {
    errors.push("Nieprawidłowa częstotliwość.");
  }
  if (has(data, "description") && data.description !== null && typeof data.description !== "string") {
    errors.push("Opis musi być tekstem.");
  }
  return errors;
}

function validateHabitLog(data) {
  const errors = [];
  if (!isDate(data.date)) errors.push("Data musi mieć format RRRR-MM-DD.");
  if (has(data, "completed") && typeof data.completed !== "boolean") errors.push("Pole completed musi być true/false.");
  return errors;
}

module.exports = { FREQUENCIES, validateHabit, validateHabitLog };
