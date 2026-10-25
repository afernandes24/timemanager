import { useState } from "react";
import Modal from "./Modal.jsx";
import BlockForm from "./BlockForm.jsx";
import TimeBlock from "./TimeBlock.jsx";
import Icon from "./Icon.jsx";
import { useToast } from "./Toast.jsx";
import { api } from "../services/api.js";
import {
  addDays,
  formatDuration,
  formatLongDate,
  fromMinutes,
  nowMinutes,
  toMinutes,
  todayISO,
} from "../services/dateUtils.js";

const PALETTE = ["blue", "yellow", "purple", "pink", "orange", "teal"];
const OVERLOAD_MINUTES = 10 * 60;

// Kolor bloku: Pomodoro – zielony, przerwa – jasnozielony, pozostałe kolejno z palety
function assignColors(blocks) {
  let index = 0;
  return blocks.map((b) => {
    const name = `${b.label || ""} ${b.task_title || ""}`.toLowerCase();
    if (!b.task_id && name.includes("przerwa")) return "break";
    if (name.includes("pomodoro")) return "green";
    return PALETTE[index++ % PALETTE.length];
  });
}

// Domyślny przedział nowego bloku: po ostatnim bloku albo od najbliższego kwadransa
function nextSlot(blocks, date) {
  let start = date === todayISO() ? Math.ceil(nowMinutes() / 15) * 15 : 9 * 60;
  if (blocks.length) start = Math.max(start, toMinutes(blocks[blocks.length - 1].end_time));
  start = Math.min(start, 23 * 60);
  return { start_time: fromMinutes(start), end_time: fromMinutes(Math.min(start + 30, 23 * 60 + 59)) };
}

// Plan dnia – zadania umieszczone w blokach czasu (time blocking)
export default function DayPlan({ date, onDateChange, blocks, tasks, onChanged, compact = false }) {
  const notify = useToast();
  const [editing, setEditing] = useState(null); // null | "new" | blok

  const colors = assignColors(blocks);
  const planned = blocks.reduce((sum, b) => sum + toMinutes(b.end_time) - toMinutes(b.start_time), 0);
  const isToday = date === todayISO();
  const now = nowMinutes();

  const save = async (values) => {
    if (editing === "new") {
      await api.blocks.create(values);
      notify("Dodano blok do planu dnia.");
    } else {
      await api.blocks.update(editing.id, values);
      notify("Zapisano zmiany w planie.");
    }
    setEditing(null);
    onChanged();
  };

  const remove = async () => {
    try {
      await api.blocks.remove(editing.id);
      notify("Usunięto blok z planu.");
      setEditing(null);
      onChanged();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  // Korekta planu: przesunięcie (oba końce) albo skrócenie/wydłużenie (koniec)
  const adjust = async (block, startDelta, endDelta) => {
    const start = toMinutes(block.start_time) + startDelta;
    const end = toMinutes(block.end_time) + endDelta;
    if (start < 0 || end > 23 * 60 + 59) return notify("Blok nie może wyjść poza dany dzień.", "error");
    if (end - start < 5) return notify("Blok musi trwać co najmniej 5 minut.", "error");
    try {
      await api.blocks.update(block.id, { start_time: fromMinutes(start), end_time: fromMinutes(end) });
      onChanged();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <section className="card day-plan">
      <div className="card-header">
        <div>
          <h2 className="card-title">Plan dnia</h2>
          <p className="card-subtitle">
            {isToday ? "Dziś · " : ""}
            {formatLongDate(date)}
          </p>
        </div>
        <div className="day-plan-nav">
          <button type="button" className="icon-btn" onClick={() => onDateChange(addDays(date, -1))} aria-label="Poprzedni dzień">
            <Icon name="left" />
          </button>
          {!isToday && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDateChange(todayISO())}>
              Dziś
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => onDateChange(addDays(date, 1))} aria-label="Następny dzień">
            <Icon name="right" />
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
            <Icon name="plus" size={14} /> Blok
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="empty">
          <p>Brak zaplanowanych bloków na ten dzień.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing("new")}>
            Zaplanuj pierwszy blok
          </button>
        </div>
      ) : (
        <div className={`time-blocks${compact ? " compact" : ""}`}>
          {blocks.map((block, i) => (
            <TimeBlock
              key={block.id}
              block={block}
              color={colors[i]}
              isNow={isToday && now >= toMinutes(block.start_time) && now < toMinutes(block.end_time)}
              onEdit={setEditing}
              onAdjust={adjust}
            />
          ))}
        </div>
      )}

      <p className={`day-plan-footer${planned > OVERLOAD_MINUTES ? " warn" : ""}`}>
        Zaplanowano {formatDuration(planned)} w {blocks.length} {blocks.length === 1 ? "bloku" : "blokach"}
        {planned > OVERLOAD_MINUTES && " – dzień może być przeładowany, zostaw czas na przerwy."}
      </p>

      {editing && (
        <Modal title={editing === "new" ? "Nowy blok czasu" : "Edycja bloku czasu"} onClose={() => setEditing(null)}>
          <BlockForm
            block={editing === "new" ? null : editing}
            defaults={{ date, ...nextSlot(blocks, date) }}
            tasks={tasks}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            onDelete={editing === "new" ? null : remove}
          />
        </Modal>
      )}
    </section>
  );
}
