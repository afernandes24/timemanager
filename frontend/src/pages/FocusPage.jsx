import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import PomodoroTimer from "../components/PomodoroTimer.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../services/api.js";
import { formatDuration, todayISO } from "../services/dateUtils.js";

// Tryb skupienia – timer Pomodoro i historia dzisiejszych sesji
export default function FocusPage() {
  const notify = useToast();
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await api.sessions.list(todayISO()));
    } catch (error) {
      notify(error.message, "error");
    }
  }, [notify]);

  useEffect(() => {
    api.tasks
      .list({ sort: "priority" })
      .then((all) => setTasks(all.filter((t) => t.status !== "done")))
      .catch((error) => notify(error.message, "error"));
    loadSessions();
  }, [loadSessions, notify]);

  const completed = sessions.filter((s) => s.completed).length;
  const minutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="page">
      <PageHeader title="Tryb skupienia" subtitle="Technika Pomodoro – jedno zadanie, pełna koncentracja" />

      <div className="focus-grid">
        <section className="card focus-card">
          <PomodoroTimer tasks={tasks} onSessionSaved={loadSessions} />
        </section>

        <div className="dashboard-col">
          <section className="card">
            <h2 className="card-title">Dzisiaj</h2>
            <div className="stat-grid">
              <div className="stat stat-blue">
                <strong>{completed}</strong>
                <span>ukończone sesje</span>
              </div>
              <div className="stat stat-green">
                <strong>{formatDuration(minutes)}</strong>
                <span>w skupieniu</span>
              </div>
            </div>
            {sessions.length === 0 ? (
              <p className="empty-text">Nie zapisano jeszcze żadnej sesji.</p>
            ) : (
              <ul className="session-list">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <span className="session-time">
                      {s.start_time.slice(11, 16)}
                      {s.end_time ? `–${s.end_time.slice(11, 16)}` : ""}
                    </span>
                    <span className="session-task">{s.task_title || "Bez zadania"}</span>
                    <span className={`badge ${s.completed ? "status-done" : "status-new"}`}>
                      {s.completed ? `${s.duration_minutes} min` : `przerwana · ${s.duration_minutes} min`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">Zasady techniki Pomodoro</h2>
            <ol className="rules">
              <li>Wybierz jedno zadanie.</li>
              <li>Pracuj 25 minut bez przerywania.</li>
              <li>Po sygnale zrób 5 minut przerwy.</li>
              <li>Po 4 cyklach – dłuższa przerwa (15–30 min).</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
