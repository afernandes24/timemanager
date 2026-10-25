import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { POMODORO } from "../services/constants.js";
import { formatClock } from "../services/dateUtils.js";
import { storage, KEYS } from "../services/storage.js";

const LABELS = { work: "Sesja Pomodoro", shortBreak: "Przerwa", longBreak: "Długa przerwa" };

// Odczyt stanu timera zapisanego przez widok "Tryb skupienia"
function readTimer() {
  const t = storage.get(KEYS.timer) || {};
  const mode = LABELS[t.mode] ? t.mode : "work";
  const seconds = t.isRunning && t.endAt ? Math.max(0, Math.round((t.endAt - Date.now()) / 1000)) : t.timeLeft ?? POMODORO.work;
  return { mode, seconds, isRunning: Boolean(t.isRunning), taskId: t.taskId };
}

// Karta "Tryb skupienia" w widoku głównym – podgląd sesji i skrót do timera
export default function FocusMiniCard({ tasks }) {
  const [timer, setTimer] = useState(readTimer);

  useEffect(() => {
    const id = setInterval(() => setTimer(readTimer()), 1000);
    return () => clearInterval(id);
  }, []);

  const task = tasks.find((t) => String(t.id) === String(timer.taskId));
  const fallback = tasks.find((t) => t.status !== "done");

  return (
    <section className="card focus-mini">
      <h2 className="card-title">Tryb skupienia</h2>
      <p className="card-subtitle">Aktualne zadanie</p>
      <p className="focus-mini-task">{task?.title || fallback?.title || "Wybierz zadanie"}</p>
      <Link to="/skupienie" className={`focus-mini-clock${timer.isRunning ? " running" : ""}`}>
        <span className="focus-mini-time">{formatClock(timer.seconds)}</span>
        <span className="focus-mini-label">
          {LABELS[timer.mode]}
          {timer.isRunning ? " · trwa" : ""}
        </span>
      </Link>
      <div className="chip-row center">
        <span className="chip chip-blue">25 min</span>
        <span className="chip chip-green">5 min</span>
      </div>
    </section>
  );
}
