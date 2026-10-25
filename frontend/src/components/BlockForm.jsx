import { useState } from "react";
import { fromMinutes, toMinutes } from "../services/dateUtils.js";

const PRESETS = [
  { label: "Pomodoro 25 min", minutes: 25 },
  { label: "Przerwa 5 min", minutes: 5 },
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
];

// Formularz bloku czasu – przypisanie zadania do przedziału dnia (time blocking)
export default function BlockForm({ block, defaults, tasks, onSubmit, onCancel, onDelete }) {
  const [values, setValues] = useState({
    task_id: block?.task_id ?? defaults?.task_id ?? "",
    label: block?.label ?? "",
    date: block?.date ?? defaults.date,
    start_time: block?.start_time ?? defaults.start_time,
    end_time: block?.end_time ?? defaults.end_time,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const applyPreset = (preset) => {
    const end = Math.min(toMinutes(values.start_time) + preset.minutes, 23 * 60 + 59);
    setValues((v) => ({
      ...v,
      end_time: fromMinutes(end),
      label: v.label || (preset.minutes === 5 ? "Przerwa 5 min" : v.label),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!values.task_id && !values.label.trim()) {
      setError("Wybierz zadanie albo wpisz nazwę bloku.");
      return;
    }
    if (toMinutes(values.end_time) <= toMinutes(values.start_time)) {
      setError("Godzina zakończenia musi być późniejsza niż rozpoczęcia.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        ...values,
        task_id: values.task_id ? Number(values.task_id) : null,
        label: values.label.trim() || null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  // Zadanie przypisane do edytowanego bloku może być już wykonane – nadal je pokazujemy
  const options = tasks.some((t) => String(t.id) === String(values.task_id)) || !block?.task_id
    ? tasks
    : [...tasks, { id: block.task_id, title: block.task_title }];

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>Zadanie</span>
        <select className="input" value={values.task_id} onChange={change("task_id")}>
          <option value="">— bez zadania (np. przerwa, spacer) —</option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Nazwa bloku</span>
        <input
          className="input"
          value={values.label}
          maxLength={120}
          placeholder={values.task_id ? "Domyślnie nazwa zadania" : "np. Przerwa, Spacer"}
          onChange={change("label")}
        />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Dzień</span>
          <input type="date" className="input" required value={values.date} onChange={change("date")} />
        </label>
        <label className="field">
          <span>Od</span>
          <input type="time" className="input" required step={300} value={values.start_time} onChange={change("start_time")} />
        </label>
        <label className="field">
          <span>Do</span>
          <input type="time" className="input" required step={300} value={values.end_time} onChange={change("end_time")} />
        </label>
      </div>
      <div className="chip-row">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="chip" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {onDelete && (
          <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>
            Usuń blok
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Anuluj
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {block ? "Zapisz" : "Dodaj blok"}
        </button>
      </div>
    </form>
  );
}
