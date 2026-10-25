import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../services/api.js";
import { FREQUENCY_LABELS } from "../services/constants.js";
import { todayISO, weekdayShort } from "../services/dateUtils.js";

// Nawyki – czynności powtarzalne: dodawanie, odznaczanie wykonania, historia 7 dni
export default function HabitsPage() {
  const notify = useToast();
  const [habits, setHabits] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", frequency: "daily" });
  const today = todayISO();

  const load = useCallback(async () => {
    try {
      setHabits(await api.habits.list(today));
    } catch (error) {
      notify(error.message, "error");
    }
  }, [notify, today]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify("Wpisz nazwę nawyku.", "error");
    try {
      await api.habits.create(form);
      notify("Dodano nawyk.");
      setForm({ name: "", description: "", frequency: "daily" });
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const toggle = async (habit, date, completed) => {
    try {
      await api.habits.log(habit.id, date, completed);
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const remove = async (habit) => {
    if (!window.confirm(`Usunąć nawyk „${habit.name}” wraz z historią?`)) return;
    try {
      await api.habits.remove(habit.id);
      notify("Usunięto nawyk.");
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const doneToday = habits.filter((h) => h.completed).length;

  return (
    <div className="page">
      <PageHeader title="Nawyki" subtitle={`Dziś wykonano ${doneToday} z ${habits.length}`} />

      <form className="card habit-form" onSubmit={add}>
        <label className="field">
          <span>Nowy nawyk</span>
          <input
            className="input"
            placeholder="np. Wypić wodę, 30 min ruchu, Czytanie"
            value={form.name}
            maxLength={120}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Opis (opcjonalnie)</span>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Częstotliwość</span>
          <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          <Icon name="plus" size={14} /> Dodaj
        </button>
      </form>

      {habits.length === 0 ? (
        <div className="card empty">
          <p>Nie masz jeszcze nawyków. Dodaj pierwszy powyżej.</p>
        </div>
      ) : (
        <div className="habit-grid">
          {habits.map((habit) => (
            <article key={habit.id} className={`card habit-card${habit.completed ? " is-done" : ""}`}>
              <div className="habit-card-top">
                <button
                  type="button"
                  className={`habit-check${habit.completed ? " done" : ""}`}
                  onClick={() => toggle(habit, today, !habit.completed)}
                  aria-pressed={habit.completed}
                  aria-label={habit.completed ? "Cofnij wykonanie" : "Oznacz jako wykonane dziś"}
                >
                  <Icon name="check" size={18} strokeWidth={3} />
                </button>
                <div className="habit-card-info">
                  <h3>{habit.name}</h3>
                  <p>
                    {FREQUENCY_LABELS[habit.frequency]}
                    {habit.description ? ` · ${habit.description}` : ""}
                  </p>
                </div>
                <button type="button" className="icon-btn danger" onClick={() => remove(habit)} aria-label="Usuń nawyk">
                  <Icon name="trash" />
                </button>
              </div>
              <div className="habit-week" aria-label="Ostatnie 7 dni">
                {habit.history.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={`habit-day${day.completed ? " done" : ""}${day.date === today ? " today" : ""}`}
                    onClick={() => toggle(habit, day.date, !day.completed)}
                    title={day.date}
                  >
                    <span>{weekdayShort(day.date)}</span>
                    <i />
                  </button>
                ))}
              </div>
              <p className="habit-stats">
                Seria: <strong>{habit.streak}</strong> {habit.streak === 1 ? "dzień" : "dni"} · W tym tygodniu:{" "}
                <strong>{habit.week_done}/7</strong>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
