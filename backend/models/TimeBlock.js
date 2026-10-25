// Model encji BlokCzasu (tabela time_blocks)
const { isDate, isTime, toMinutes, has } = require("./validators");

const EDITABLE_FIELDS = ["task_id", "label", "date", "start_time", "end_time"];

function validateTimeBlock(data, partial = false) {
  const errors = [];

  if (!partial || has(data, "date")) {
    if (!isDate(data.date)) errors.push("Data bloku musi mieć format RRRR-MM-DD.");
  }
  if (!partial || has(data, "start_time")) {
    if (!isTime(data.start_time)) errors.push("Godzina rozpoczęcia musi mieć format GG:MM.");
  }
  if (!partial || has(data, "end_time")) {
    if (!isTime(data.end_time)) errors.push("Godzina zakończenia musi mieć format GG:MM.");
  }
  if (has(data, "task_id") && data.task_id !== null && !Number.isInteger(Number(data.task_id))) {
    errors.push("Nieprawidłowe zadanie.");
  }
  if (has(data, "label") && data.label !== null && typeof data.label !== "string") {
    errors.push("Etykieta musi być tekstem.");
  }
  if (!partial && !data.task_id && !(data.label && data.label.trim())) {
    errors.push("Blok musi mieć przypisane zadanie lub nazwę.");
  }
  return errors;
}

// Sprawdzenie zakresu po scaleniu z istniejącym rekordem (przy edycji)
function validateRange(start, end) {
  return toMinutes(end) > toMinutes(start) ? null : "Godzina zakończenia musi być późniejsza niż rozpoczęcia.";
}

module.exports = { EDITABLE_FIELDS, validateTimeBlock, validateRange };
