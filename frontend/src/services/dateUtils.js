// Funkcje pomocnicze do obsługi dat i czasu (lokalna strefa użytkownika)
const pad = (n) => String(n).padStart(2, "0");

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());

export const parseISODate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso, days) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const WEEKDAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const WEEKDAYS_SHORT = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

// "Piątek, 24.04.2026"
export const formatLongDate = (iso) => {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

// "24.04"
export const formatShortDate = (iso) => {
  if (!iso) return "";
  const d = parseISODate(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
};

export const weekdayShort = (iso) => WEEKDAYS_SHORT[parseISODate(iso).getDay()];

// "Dziś", "Jutro", "Wczoraj" albo data
export const relativeDayLabel = (iso) => {
  if (!iso) return "Bez terminu";
  const today = todayISO();
  if (iso === today) return "Dziś";
  if (iso === addDays(today, 1)) return "Jutro";
  if (iso === addDays(today, -1)) return "Wczoraj";
  return formatShortDate(iso);
};

// "HH:MM" <-> minuty od północy
export const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const fromMinutes = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
export const shortTime = (time) => (time ? time.slice(0, 5) : "");

// 110 -> "1 h 50 min"
export const formatDuration = (minutes) => {
  if (!minutes) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

// 1500 s -> "25:00"
export const formatClock = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

// Znacznik czasu w formacie bazy danych "RRRR-MM-DD GG:MM:SS" (czas lokalny)
export const toLocalTimestamp = (date) =>
  `${toISODate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
