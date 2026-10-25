import { Link } from "react-router-dom";
import { shortTime } from "../services/dateUtils.js";

// "Dzisiejsze zadania" – zadania z terminem na dziś lub zaplanowane w blokach czasu
export default function TodayTasks({ tasks, onToggle, title = "Dzisiejsze zadania" }) {
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      {tasks.length === 0 ? (
        <p className="empty-text">Brak zadań na ten dzień.</p>
      ) : (
        <ul className="today-list">
          {tasks.map((task) => (
            <li key={task.id} className={`today-item${task.status === "done" ? " is-done" : ""}`}>
              <label>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={task.status === "done"}
                  onChange={() => onToggle(task)}
                />
                <span className="today-title">{task.title}</span>
              </label>
              <span className="today-time">{shortTime(task.planned_time)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/zadania" className="btn btn-soft btn-block">
        Lista zadań
      </Link>
    </section>
  );
}
