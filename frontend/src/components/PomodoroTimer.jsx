import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { useToast } from "./Toast.jsx";
import { api } from "../services/api.js";
import { POMODORO } from "../services/constants.js";
import { formatClock, toLocalTimestamp } from "../services/dateUtils.js";
import { storage, KEYS } from "../services/storage.js";

const PHASES = {
  work: { label: "Sesja Pomodoro", seconds: POMODORO.work },
  shortBreak: { label: "Przerwa", seconds: POMODORO.shortBreak },
  longBreak: { label: "Długa przerwa", seconds: POMODORO.longBreak },
};

// Krótki sygnał dźwiękowy po zakończeniu fazy (zamiast dzwonka minutnika)
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    /* dźwięk jest opcjonalny */
  }
}

// Timer techniki Pomodoro: 25 min pracy, 5 min przerwy, po 4 cyklach dłuższa przerwa.
// Ukończone (i przerwane) sesje są zapisywane w bazie jako focus_sessions.
export default function PomodoroTimer({ tasks, onSessionSaved }) {
  const notify = useToast();
  const [mode, setMode] = useState("work");
  const [cycle, setCycle] = useState(0);
  const [taskId, setTaskId] = useState("");
  const [workStartedAt, setWorkStartedAt] = useState(null);
  const [endAt, setEndAt] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const finishing = useRef(false);

  // --- Listing 3.2: logika odliczania czasu -------------------------------
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);
  // -------------------------------------------------------------------------

  // Odtworzenie tymczasowego stanu sesji z Local Storage (np. po odświeżeniu strony)
  useEffect(() => {
    const saved = storage.get(KEYS.timer);
    if (saved && PHASES[saved.mode]) {
      setMode(saved.mode);
      setCycle(saved.cycle || 0);
      setTaskId(saved.taskId || "");
      setWorkStartedAt(saved.workStartedAt || null);
      if (saved.isRunning && saved.endAt) {
        setTimeLeft(Math.max(0, Math.round((saved.endAt - Date.now()) / 1000)));
        setEndAt(saved.endAt);
        setIsRunning(true);
      } else {
        setTimeLeft(Math.max(0, Math.min(saved.timeLeft ?? PHASES[saved.mode].seconds, PHASES[saved.mode].seconds)));
      }
    }
    setHydrated(true);
  }, []);

  // Zapis bieżącego stanu w Local Storage
  useEffect(() => {
    if (!hydrated) return;
    storage.set(KEYS.timer, { mode, cycle, taskId, timeLeft, isRunning, endAt, workStartedAt });
  }, [hydrated, mode, cycle, taskId, timeLeft, isRunning, endAt, workStartedAt]);

  // Korekta czasu po powrocie do karty przeglądarki (interwały w tle bywają spowalniane)
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "visible" && isRunning && endAt) {
        setTimeLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
      }
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [isRunning, endAt]);

  // Czas w tytule karty przeglądarki
  useEffect(() => {
    document.title = isRunning ? `${formatClock(timeLeft)} · ${PHASES[mode].label}` : "TimeManager";
    return () => {
      document.title = "TimeManager";
    };
  }, [isRunning, timeLeft, mode]);

  const saveSession = async ({ minutes, completed, end }) => {
    try {
      await api.sessions.create({
        task_id: taskId ? Number(taskId) : null,
        start_time: toLocalTimestamp(new Date(workStartedAt || end.getTime() - minutes * 60000)),
        end_time: toLocalTimestamp(end),
        duration_minutes: minutes,
        completed,
      });
      onSessionSaved?.();
    } catch (error) {
      notify(`Nie zapisano sesji: ${error.message}`, "error");
    }
  };

  const startPhase = (nextMode, autoStart) => {
    const seconds = PHASES[nextMode].seconds;
    setMode(nextMode);
    setTimeLeft(seconds);
    setIsRunning(autoStart);
    setEndAt(autoStart ? Date.now() + seconds * 1000 : null);
    setWorkStartedAt(null);
  };

  // Zakończenie fazy: po pracy zapis sesji i przerwa, po przerwie powrót do pracy
  useEffect(() => {
    if (timeLeft !== 0 || !isRunning || finishing.current) return;
    finishing.current = true;
    beep();

    if (mode === "work") {
      const end = endAt ? new Date(endAt) : new Date();
      const nextCycle = cycle + 1;
      const longBreak = nextCycle % POMODORO.cyclesBeforeLongBreak === 0;
      saveSession({ minutes: POMODORO.work / 60, completed: true, end }).finally(() => {
        setCycle(nextCycle);
        startPhase(longBreak ? "longBreak" : "shortBreak", true);
        notify(longBreak ? "4 sesje za Tobą! Czas na dłuższą przerwę." : "Koniec sesji – czas na 5 minut przerwy.");
        finishing.current = false;
      });
    } else {
      startPhase("work", false);
      notify("Przerwa zakończona. Możesz rozpocząć kolejne pomodoro.");
      finishing.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning]);

  const start = () => {
    if (mode === "work" && !workStartedAt) setWorkStartedAt(Date.now());
    setEndAt(Date.now() + timeLeft * 1000);
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
    setEndAt(null);
  };

  const reset = () => startPhase(mode, false);

  // Przerwanie sesji przed czasem – zapisujemy faktycznie przepracowane minuty
  const endSession = async () => {
    const minutes = Math.floor((POMODORO.work - timeLeft) / 60);
    pause();
    if (minutes >= 1) {
      await saveSession({ minutes, completed: false, end: new Date() });
      notify(`Zapisano przerwaną sesję (${minutes} min).`);
    }
    startPhase("work", false);
  };

  const phase = PHASES[mode];
  const progress = 1 - timeLeft / phase.seconds;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const doneDots = mode === "longBreak" ? POMODORO.cyclesBeforeLongBreak : cycle % POMODORO.cyclesBeforeLongBreak;
  const currentTask = tasks.find((t) => String(t.id) === String(taskId));
  const phaseStarted = mode === "work" && (isRunning || timeLeft < POMODORO.work);

  return (
    <div className={`pomodoro mode-${mode}`}>
      <label className="field pomodoro-task">
        <span>Aktualne zadanie</span>
        <select
          className="input"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          disabled={phaseStarted}
        >
          <option value="">— wybierz zadanie —</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
          {taskId && !currentTask && <option value={taskId}>(zadanie zakończone)</option>}
        </select>
      </label>

      <div className="pomodoro-dial">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle className="dial-track" cx="110" cy="110" r={radius} />
          <circle
            className="dial-progress"
            cx="110"
            cy="110"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className="pomodoro-clock">
          <span className="pomodoro-time" aria-live="off">
            {formatClock(timeLeft)}
          </span>
          <span className="pomodoro-phase">{phase.label}</span>
        </div>
      </div>

      <div className="pomodoro-dots" aria-label={`Ukończone cykle: ${doneDots} z 4`}>
        {Array.from({ length: POMODORO.cyclesBeforeLongBreak }, (_, i) => (
          <span key={i} className={`dot${i < doneDots ? " filled" : ""}`} />
        ))}
      </div>

      <div className="pomodoro-controls">
        {isRunning ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={pause}>
            <Icon name="pause" /> Pauza
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-lg" onClick={start}>
            <Icon name="play" /> {timeLeft < phase.seconds ? "Wznów" : mode === "work" ? "Start" : "Rozpocznij przerwę"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={reset} title="Zacznij fazę od nowa">
          <Icon name="reset" /> Reset
        </button>
        {mode === "work" ? (
          <button type="button" className="btn btn-danger-ghost" onClick={endSession} disabled={!phaseStarted}>
            <Icon name="stop" /> Zakończ sesję
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => startPhase("work", false)}>
            Pomiń przerwę
          </button>
        )}
      </div>

      <p className="pomodoro-hint">
        {mode === "work"
          ? "Pracuj tylko nad jednym zadaniem. Po sygnale zrób obowiązkową przerwę."
          : "Oderwij się od pracy – wstań, napij się wody, odpocznij od ekranu."}
      </p>
    </div>
  );
}
