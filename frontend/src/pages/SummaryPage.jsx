import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../services/api.js";
import { STATUS_LABELS } from "../services/constants.js";
import { addDays, formatDuration, formatLongDate, todayISO, weekdayShort } from "../services/dateUtils.js";

// Prosty wykres słupkowy (ostatnie 7 dni)
function WeekChart({ title, data, valueKey, color, format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <div className="bar-chart" role="img" aria-label={title}>
        {data.map((d) => (
          <div key={d.date} className="bar-col">
            <span className="bar-value">{d[valueKey] ? format(d[valueKey]) : ""}</span>
            <div className="bar-track">
              <div className={`bar bar-${color}`} style={{ height: `${(d[valueKey] / max) * 100}%` }} />
            </div>
            <span className="bar-label">{weekdayShort(d.date)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Podsumowanie – kontrola postępów: realizacja planu, sesje, nawyki, tydzień
export default function SummaryPage() {
  const notify = useToast();
  const [date, setDate] = useState(todayISO);
  const [summary, setSummary] = useState(null);

  const load = useCallback(async () => {
    try {
      setSummary(await api.summary(date));
    } catch (error) {
      notify(error.message, "error");
    }
  }, [date, notify]);

  useEffect(() => {
    load();
  }, [load]);

  if (!summary) {
    return (
      <div className="page">
        <PageHeader title="Podsumowanie" subtitle={formatLongDate(date)} />
      </div>
    );
  }

  const { tasks, sessions, planned, habits, week, statuses, plan_percent: planPercent } = summary;
  const weekFocus = week.reduce((s, d) => s + d.focus_minutes, 0);
  const weekTasks = week.reduce((s, d) => s + d.tasks_done, 0);
  const totalStatus = Object.values(statuses).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="page">
      <PageHeader title="Podsumowanie" subtitle={formatLongDate(date)}>
        <div className="day-plan-nav">
          <button type="button" className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Poprzedni dzień">
            <Icon name="left" />
          </button>
          {date !== todayISO() && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(todayISO())}>
              Dziś
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => setDate(addDays(date, 1))} aria-label="Następny dzień">
            <Icon name="right" />
          </button>
        </div>
      </PageHeader>

      <div className="summary-tiles">
        <div className="stat stat-green big">
          <strong>
            {tasks.done}/{tasks.total}
          </strong>
          <span>wykonane zadania</span>
        </div>
        <div className="stat stat-purple big">
          <strong>{planPercent}%</strong>
          <span>realizacji planu</span>
          <div className="progress">
            <div style={{ width: `${planPercent}%` }} />
          </div>
        </div>
        <div className="stat stat-blue big">
          <strong>{sessions.completed}</strong>
          <span>sesje skupienia · {formatDuration(sessions.minutes)}</span>
        </div>
        <div className="stat stat-orange big">
          <strong>
            {habits.done}/{habits.total}
          </strong>
          <span>nawyki</span>
        </div>
        <div className="stat stat-teal big">
          <strong>{formatDuration(planned.minutes)}</strong>
          <span>zaplanowane w {planned.count} blokach</span>
        </div>
      </div>

      <div className="summary-grid">
        <WeekChart title={`Czas w skupieniu – 7 dni (${formatDuration(weekFocus)})`} data={week} valueKey="focus_minutes" color="blue" />
        <WeekChart title={`Wykonane zadania – 7 dni (${weekTasks})`} data={week} valueKey="tasks_done" color="green" />
        <WeekChart title="Wykonane nawyki – 7 dni" data={week} valueKey="habits_done" color="orange" />

        <section className="card">
          <h2 className="card-title">Wszystkie zadania wg statusu</h2>
          <div className="stacked">
            {["done", "in_progress", "new"].map((s) => (
              <div key={s} className={`stacked-part status-bg-${s}`} style={{ width: `${((statuses[s] || 0) / totalStatus) * 100}%` }} />
            ))}
          </div>
          <ul className="legend">
            {["done", "in_progress", "new"].map((s) => (
              <li key={s}>
                <i className={`status-bg-${s}`} /> {STATUS_LABELS[s]}: <strong>{statuses[s] || 0}</strong>
              </li>
            ))}
          </ul>
          <p className="card-subtitle">
            Plan → wykonanie → kontrola: porównuj zaplanowany czas z czasem w skupieniu, aby lepiej szacować kolejne dni.
          </p>
        </section>
      </div>
    </div>
  );
}
