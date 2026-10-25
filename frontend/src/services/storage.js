// Pomocniczy zapis lokalny (Local Storage) – ustawienia interfejsu,
// ostatnio używany widok i tymczasowy stan sesji skupienia.
// Nie zastępuje bazy danych: główne dane są zapisywane w PostgreSQL.
const PREFIX = "timemanager.";

export const KEYS = {
  lastView: "lastView",
  timer: "timer",
  taskFilters: "taskFilters",
};

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* zapis lokalny jest opcjonalny */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignorujemy */
    }
  },
};
