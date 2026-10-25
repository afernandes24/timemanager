import { Link } from "react-router-dom";

// Lista nawyków w widoku głównym – kliknięcie odznacza wykonanie w danym dniu
export default function HabitList({ habits, onToggle }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Nawyki</h2>
        <Link to="/nawyki" className="link-sm">
          Wszystkie
        </Link>
      </div>
      {habits.length === 0 ? (
        <p className="empty-text">Brak nawyków. Dodaj pierwszy w widoku Nawyki.</p>
      ) : (
        <ul className="habit-mini-list">
          {habits.map((habit) => (
            <li key={habit.id}>
              <button
                type="button"
                className="habit-mini"
                onClick={() => onToggle(habit)}
                aria-pressed={habit.completed}
                title={habit.completed ? "Cofnij wykonanie" : "Oznacz jako wykonane"}
              >
                <span>{habit.name}</span>
                <span className={`habit-dot${habit.completed ? " done" : ""}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
