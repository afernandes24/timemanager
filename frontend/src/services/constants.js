// Etykiety i ustawienia używane w całej aplikacji
export const STATUS_LABELS = {
  new: "Do zrobienia",
  in_progress: "W trakcie",
  done: "Zrobione",
};

export const PRIORITY_LABELS = {
  high: "Wysoki",
  medium: "Średni",
  low: "Niski",
};

export const FREQUENCY_LABELS = {
  daily: "Codziennie",
  weekdays: "W dni robocze",
  weekly: "Raz w tygodniu",
};

// Technika Pomodoro (F. Cirillo): 25 min pracy, 5 min przerwy,
// po 4 cyklach dłuższa przerwa
export const POMODORO = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  cyclesBeforeLongBreak: 4,
};

export const NAV_ITEMS = [
  { to: "/", label: "Plan dnia" },
  { to: "/inbox", label: "Inbox" },
  { to: "/zadania", label: "Lista zadań" },
  { to: "/skupienie", label: "Tryb skupienia" },
  { to: "/nawyki", label: "Nawyki" },
  { to: "/podsumowanie", label: "Podsumowanie" },
];
