import { useState } from "react";
import { api } from "../services/api.js";
import { useToast } from "./Toast.jsx";

// Formularz szybkiego dodawania zadania (GTD – gromadzenie).
// Bez terminu zadanie trafia do Inboxu; "Szczegóły" pozwalają dodać opis, termin i priorytet.
export default function QuickAddTask({ onAdded, defaultDeadline = "", placeholder = "Dodaj zadanie do Inbox" }) {
  const notify = useToast();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState(false);
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      notify("Wpisz nazwę zadania.", "error");
      return;
    }
    setSaving(true);
    try {
      const task = await api.tasks.create({ title, description, deadline: deadline || null, priority });
      notify(task.due_date ? "Dodano zadanie." : "Dodano zadanie do Inboxu.");
      setTitle("");
      setDescription("");
      setDeadline(defaultDeadline);
      setPriority("medium");
      onAdded?.(task);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card quick-add" onSubmit={submit}>
      <div className="quick-add-row">
        <label htmlFor="quick-add-title" className="quick-add-label">
          Szybkie dodanie zadania
        </label>
        <input
          id="quick-add-title"
          className="input quick-add-input"
          placeholder={placeholder}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="button" className="btn btn-ghost" onClick={() => setDetails((v) => !v)} aria-expanded={details}>
          {details ? "Mniej" : "Szczegóły"}
        </button>
        <button type="submit" className="btn btn-primary quick-add-submit" disabled={saving}>
          Dodaj
        </button>
      </div>
      {details && (
        <div className="quick-add-details">
          <label className="field">
            <span>Opis</span>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field">
            <span>Termin wykonania</span>
            <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <label className="field">
            <span>Priorytet</span>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="high">Wysoki</option>
              <option value="medium">Średni</option>
              <option value="low">Niski</option>
            </select>
          </label>
        </div>
      )}
    </form>
  );
}
