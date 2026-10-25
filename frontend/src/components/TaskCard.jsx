import Icon from "./Icon.jsx";
import { PRIORITY_LABELS, STATUS_LABELS } from "../services/constants.js";
import { formatDuration, relativeDayLabel, todayISO } from "../services/dateUtils.js";

// Karta pojedynczego zadania: nazwa, status, priorytet, termin i czas zaplanowany
export default function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const done = task.status === "done";
  const overdue = task.due_date && task.due_date < todayISO() && !done;

  return (
    <article className={`task-card${done ? " is-done" : ""}`}>
      <input
        type="checkbox"
        className="checkbox"
        checked={done}
        onChange={() => onStatusChange(task, done ? "new" : "done")}
        aria-label={done ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
      />
      <div className="task-card-body">
        <button type="button" className="task-card-title" onClick={() => onEdit(task)}>
          {task.title}
        </button>
        {task.description && <p className="task-card-desc">{task.description}</p>}
        <div className="task-card-meta">
          <select
            className={`badge badge-select status-${task.status}`}
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            aria-label="Status zadania"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className={`badge priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
          <span className={`meta-text${overdue ? " overdue" : ""}`}>
            {overdue ? "Po terminie · " : ""}
            {relativeDayLabel(task.due_date)}
          </span>
          {task.planned_minutes > 0 && <span className="meta-text">⏱ {formatDuration(task.planned_minutes)}</span>}
        </div>
      </div>
      <div className="task-card-actions">
        <button type="button" className="icon-btn" onClick={() => onEdit(task)} aria-label="Edytuj zadanie" title="Edytuj">
          <Icon name="edit" />
        </button>
        <button type="button" className="icon-btn danger" onClick={() => onDelete(task)} aria-label="Usuń zadanie" title="Usuń">
          <Icon name="trash" />
        </button>
      </div>
    </article>
  );
}
