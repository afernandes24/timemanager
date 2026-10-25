import { useState } from "react";
import { PRIORITY_LABELS, STATUS_LABELS } from "../services/constants.js";

// Formularz dodawania / edycji zadania: nazwa, opis, termin, priorytet, status
export default function TaskForm({ task, onSubmit, onCancel, onDelete }) {
  const [values, setValues] = useState({
    title: task?.title || "",
    description: task?.description || "",
    deadline: task?.due_date || "",
    priority: task?.priority || "medium",
    status: task?.status || "new",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!values.title.trim()) {
      setError("Nazwa zadania jest wymagana.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ ...values, deadline: values.deadline || null });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>Nazwa zadania *</span>
        <input className="input" autoFocus value={values.title} maxLength={200} onChange={change("title")} />
      </label>
      <label className="field">
        <span>Opis</span>
        <textarea className="input" rows={3} value={values.description} onChange={change("description")} />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Termin wykonania</span>
          <input type="date" className="input" value={values.deadline} onChange={change("deadline")} />
        </label>
        <label className="field">
          <span>Priorytet</span>
          <select className="input" value={values.priority} onChange={change("priority")}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {task && (
          <label className="field">
            <span>Status</span>
            <select className="input" value={values.status} onChange={change("status")}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!values.deadline && <p className="form-hint">Zadanie bez terminu trafi do Inboxu.</p>}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {onDelete && (
          <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>
            Usuń
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Anuluj
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {task ? "Zapisz zmiany" : "Dodaj zadanie"}
        </button>
      </div>
    </form>
  );
}
