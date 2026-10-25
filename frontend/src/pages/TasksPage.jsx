import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import TaskCard from "../components/TaskCard.jsx";
import TaskForm from "../components/TaskForm.jsx";
import Modal from "../components/Modal.jsx";
import Icon from "../components/Icon.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../services/api.js";
import { PRIORITY_LABELS, STATUS_LABELS } from "../services/constants.js";
import { addDays, todayISO } from "../services/dateUtils.js";
import { storage, KEYS } from "../services/storage.js";

const DEFAULT_FILTERS = { q: "", status: "", priority: "", sort: "deadline", group: "status" };

// Grupowanie zadań według wybranej kategorii
function groupTasks(tasks, group) {
  if (group === "none") return [{ key: "all", label: null, tasks }];

  const today = todayISO();
  const weekEnd = addDays(today, 7);
  const keyOf = {
    status: (t) => t.status,
    priority: (t) => t.priority,
    deadline: (t) => {
      if (!t.due_date) return "none";
      if (t.due_date < today) return t.status === "done" ? "past" : "overdue";
      if (t.due_date === today) return "today";
      if (t.due_date === addDays(today, 1)) return "tomorrow";
      return t.due_date <= weekEnd ? "week" : "later";
    },
  }[group];

  const labels = {
    status: STATUS_LABELS,
    priority: { high: "Priorytet wysoki", medium: "Priorytet średni", low: "Priorytet niski" },
    deadline: {
      overdue: "Po terminie",
      today: "Dziś",
      tomorrow: "Jutro",
      week: "W tym tygodniu",
      later: "Później",
      none: "Bez terminu (Inbox)",
      past: "Wcześniej wykonane",
    },
  }[group];

  return Object.keys(labels)
    .map((key) => ({ key, label: labels[key], tasks: tasks.filter((t) => keyOf(t) === key) }))
    .filter((g) => g.tasks.length);
}

// Lista zadań – wyszukiwanie, filtrowanie, sortowanie, grupowanie, edycja i usuwanie
export default function TasksPage() {
  const notify = useToast();
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, ...storage.get(KEYS.taskFilters, {}), q: "" }));
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | zadanie

  // Opóźnienie wyszukiwania, aby nie wysyłać żądania po każdym znaku
  useEffect(() => {
    const id = setTimeout(() => setFilters((f) => ({ ...f, q: search })), 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const { q, ...rest } = filters;
    storage.set(KEYS.taskFilters, rest);
  }, [filters]);

  const load = useCallback(async () => {
    try {
      const { q, status, priority, sort } = filters;
      setTasks(await api.tasks.list({ q, status, priority, sort }));
    } catch (error) {
      notify(error.message, "error");
    }
  }, [filters, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => groupTasks(tasks, filters.group), [tasks, filters.group]);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const changeStatus = async (task, status) => {
    try {
      await api.tasks.setStatus(task.id, status);
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const remove = async (task) => {
    if (!window.confirm(`Usunąć zadanie „${task.title}”?`)) return;
    try {
      await api.tasks.remove(task.id);
      notify("Usunięto zadanie.");
      setEditing(null);
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const save = async (values) => {
    if (editing === "new") {
      await api.tasks.create(values);
      notify("Dodano zadanie.");
    } else {
      await api.tasks.update(editing.id, values);
      notify("Zapisano zmiany.");
    }
    setEditing(null);
    load();
  };

  return (
    <div className="page">
      <PageHeader title="Lista zadań" subtitle={`${tasks.length} zadań · ${doneCount} wykonanych`}>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          <Icon name="plus" size={14} /> Nowe zadanie
        </button>
      </PageHeader>

      <div className="card toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Szukaj w nazwie lub opisie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Szukaj zadań"
        />
        <select className="input" value={filters.status} onChange={setFilter("status")} aria-label="Filtruj według statusu">
          <option value="">Każdy status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="input" value={filters.priority} onChange={setFilter("priority")} aria-label="Filtruj według priorytetu">
          <option value="">Każdy priorytet</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="input" value={filters.sort} onChange={setFilter("sort")} aria-label="Sortowanie">
          <option value="deadline">Sortuj: termin</option>
          <option value="priority">Sortuj: priorytet</option>
          <option value="created">Sortuj: najnowsze</option>
          <option value="title">Sortuj: nazwa</option>
        </select>
        <select className="input" value={filters.group} onChange={setFilter("group")} aria-label="Grupowanie">
          <option value="status">Grupuj: status</option>
          <option value="deadline">Grupuj: termin</option>
          <option value="priority">Grupuj: priorytet</option>
          <option value="none">Bez grupowania</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="card empty">
          <p>Brak zadań spełniających kryteria.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="task-group">
            {group.label && (
              <h2 className="group-title">
                {group.label} <span className="group-count">{group.tasks.length}</span>
              </h2>
            )}
            <div className="task-list">
              {group.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={changeStatus} onEdit={setEditing} onDelete={remove} />
              ))}
            </div>
          </section>
        ))
      )}

      {editing && (
        <Modal title={editing === "new" ? "Nowe zadanie" : "Edycja zadania"} onClose={() => setEditing(null)}>
          <TaskForm
            task={editing === "new" ? null : editing}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            onDelete={editing === "new" ? null : () => remove(editing)}
          />
        </Modal>
      )}
    </div>
  );
}
