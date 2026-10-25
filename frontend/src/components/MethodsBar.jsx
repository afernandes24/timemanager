import { Link } from "react-router-dom";

const METHODS = [
  { name: "GTD", to: "/inbox", color: "blue", hint: "Getting Things Done – zapisz i uporządkuj zadania w Inboxie" },
  { name: "Pomodoro", to: "/skupienie", color: "green", hint: "25 min skupienia i 5 min przerwy" },
  { name: "Time blocking", to: "/", color: "purple", hint: "Każde ważne zadanie ma swój blok w planie dnia" },
];

// Metody zarządzania czasem, na których oparto aplikację
export default function MethodsBar() {
  return (
    <section className="card methods">
      <h2 className="card-title">Metody zarządzania czasem</h2>
      <div className="methods-row">
        {METHODS.map((m) => (
          <Link key={m.name} to={m.to} className={`method-chip chip-${m.color}`} title={m.hint}>
            {m.name}
          </Link>
        ))}
        <span className="methods-text">Aplikacja łączy planowanie, skupienie i kontrolę postępów.</span>
      </div>
    </section>
  );
}
