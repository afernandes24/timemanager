// Model encji Zadanie (tabela tasks)
const { isDate, isNonEmptyText, has } = require("./validators");

const STATUSES = ["new", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

// Pola, które użytkownik może zmieniać (nazwa w API -> kolumna w bazie)
const EDITABLE_FIELDS = {
  title: "title",
  description: "description",
  deadline: "due_date",
  priority: "priority",
  status: "status",
};

/**
 * Walidacja danych zadania.
 * @param {object} data dane z formularza
 * @param {boolean} partial true przy edycji (sprawdzane są tylko przesłane pola)
 * @returns {string[]} lista komunikatów o błędach
 */
function validateTask(data, partial = false) {
  const errors = [];

  if (!partial || has(data, "title")) {
    if (!isNonEmptyText(data.title, 200)) errors.push("Nazwa zadania jest wymagana (max 200 znaków).");
  }
  if (has(data, "description") && data.description !== null && typeof data.description !== "string") {
    errors.push("Opis musi być tekstem.");
  }
  if (has(data, "deadline") && data.deadline !== null && data.deadline !== "" && !isDate(data.deadline)) {
    errors.push("Termin musi mieć format RRRR-MM-DD.");
  }
  if (has(data, "priority") && !PRIORITIES.includes(data.priority)) {
    errors.push("Nieprawidłowy priorytet.");
  }
  if (has(data, "status") && !STATUSES.includes(data.status)) {
    errors.push("Nieprawidłowy status.");
  }
  return errors;
}

module.exports = { STATUSES, PRIORITIES, EDITABLE_FIELDS, validateTask };
