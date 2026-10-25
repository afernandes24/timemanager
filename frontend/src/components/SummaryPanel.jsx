import { Link } from "react-router-dom";

// Panel podsumowania: wykonane zadania, sesje skupienia, realizacja planu, nawyki
export default function SummaryPanel({ summary }) {
  const s = summary || {
    tasks: { done: 0, total: 0 },
    sessions: { completed: 0 },
    plan_percent: 0,
    habits: { done: 0, total: 0 },
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Podsumowanie</h2>
        <Link to="/podsumowanie" className="link-sm">
          Szczegóły
        </Link>
      </div>
      <div className="stat-grid">
        <div className="stat stat-green">
          <strong>
            {s.tasks.done}/{s.tasks.total}
          </strong>
          <span>zadania</span>
        </div>
        <div className="stat stat-blue">
          <strong>{s.sessions.completed}</strong>
          <span>sesje</span>
        </div>
        <div className="stat stat-purple">
          <strong>{s.plan_percent}%</strong>
          <span>planu</span>
        </div>
        <div className="stat stat-orange">
          <strong>
            {s.habits.done}/{s.habits.total}
          </strong>
          <span>nawyki</span>
        </div>
      </div>
    </section>
  );
}
