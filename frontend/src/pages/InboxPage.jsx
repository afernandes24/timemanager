import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import QuickAddTask from "../components/QuickAddTask.jsx";
import Modal from "../components/Modal.jsx";
import TaskForm from "../components/TaskForm.jsx";
import Icon from "../components/Icon.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../services/api.js";
import { PRIORITY_LABELS } from "../services/constants.js";
import { addDays, todayISO } from "../services/dateUtils.js";

const GTD_STEPS = [
  { name: "Gromadzenie", text: "Zapisz wszystko w jednym miejscu" },
  { name: "Analizowanie", text: "Czy wymaga działania? < 2 min – zrób od razu" },
  { name: "Porządkowanie", text: "Nadaj termin i priorytet" },
  { name: "Przeglądanie", text: "Regularnie przeglądaj listę" },
  { name: "Realizacja", text: "Wykonuj zgodnie z planem" },
];

// Inbox – etap gromadzenia i analizowania zadań (metoda Getting Things Done)
export default function InboxPage() {
  const notify = useToast();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.tasks.list({ inbox: "true", sort: "created" }));
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoaded(true);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, message) => {
    try {
      await action();
      notify(message);
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const schedule = (task, date, label) =>
    run(() => api.tasks.update(task.id, { deadline: date }), `Przeniesiono „${task.title}” na ${label}.`);

  return (
    <div className="page">
      <PageHeader title="Inbox" subtitle="Gromadzenie i analizowanie zadań – Getting Things Done" />

      <QuickAddTask onAdded={load} placeholder="Co masz w głowie? Zapisz to tutaj…" />

      <ol className="gtd-steps">
        {GTD_STEPS.map((step, i) => (
          <li key={step.name} className={i < 3 ? "active" : ""}>
            <span className="gtd-num">{i + 1}</span>
            <span>
              <strong>{step.name}</strong>
              <small>{step.text}</small>
            </span>
          </li>
        ))}
      </ol>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Do przeanalizowania ({items.length})</h2>
            <p className="card-subtitle">
              Zasada dwóch minut: jeśli zadanie zajmie mniej niż 2 minuty – wykonaj je od razu.
            </p>
          </div>
        </div>

        {loaded && items.length === 0 ? (
          <div className="empty">
            <p>
              <strong>Inbox jest pusty.</strong> Wszystkie zadania zostały przeanalizowane.
            </p>
          </div>
        ) : (
          <ul className="inbox-list">
            {items.map((task) => (
              <li key={task.id} className="inbox-item">
                <div className="inbox-main">
                  <button type="button" className="task-card-title" onClick={() => setEditing(task)}>
                    {task.title}
                  </button>
                  {task.description && <p className="task-card-desc">{task.description}</p>}
                  <span className={`badge priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                </div>
                <div className="inbox-actions">
                  <button
                    type="button"
                    className="btn btn-soft-green btn-sm"
                    onClick={() => run(() => api.tasks.setStatus(task.id, "done"), "Zrobione od razu – zasada 2 minut.")}
                  >
                    <Icon name="bolt" size={14} /> Zrobione (&lt; 2 min)
                  </button>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => schedule(task, todayISO(), "dziś")}>
                    Na dziś
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => schedule(task, addDays(todayISO(), 1), "jutro")}
                  >
                    Jutro
                  </button>
                  <label className="btn btn-ghost btn-sm date-pick" title="Wybierz termin">
                    <Icon name="calendar" size={14} /> Termin
                    <input
                      type="date"
                      min={todayISO()}
                      onChange={(e) => e.target.value && schedule(task, e.target.value, e.target.value)}
                      aria-label="Wybierz termin zadania"
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Usuń – nie wymaga działania"
                    aria-label="Usuń zadanie"
                    onClick={() => run(() => api.tasks.remove(task.id), "Usunięto zadanie z Inboxu.")}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <Modal title="Edycja zadania" onClose={() => setEditing(null)}>
          <TaskForm
            task={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await api.tasks.update(editing.id, values);
              notify("Zapisano zmiany.");
              setEditing(null);
              load();
            }}
            onDelete={() =>
              run(() => api.tasks.remove(editing.id), "Usunięto zadanie.").then(() => setEditing(null))
            }
          />
        </Modal>
      )}
    </div>
  );
}
