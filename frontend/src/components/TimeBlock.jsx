import Icon from "./Icon.jsx";

// Pojedynczy blok czasu w planie dnia: godziny, nazwa aktywności
// oraz szybka korekta (przesunięcie, skrócenie, wydłużenie)
export default function TimeBlock({ block, color, isNow, onEdit, onAdjust }) {
  const done = block.task_status === "done";
  const name = block.label || block.task_title;

  return (
    <div className={`time-block block-${color}${isNow ? " is-now" : ""}${done ? " is-done" : ""}`}>
      <button
        type="button"
        className="time-block-main"
        onClick={() => onEdit(block)}
        title={block.task_title ? `Zadanie: ${block.task_title} – kliknij, aby edytować` : "Kliknij, aby edytować"}
      >
        <span className="time-block-time">
          {block.start_time}–{block.end_time}
        </span>
        <span className="time-block-name">{name}</span>
        {done && (
          <span className="time-block-check" title="Zadanie wykonane">
            <Icon name="check" size={14} strokeWidth={3} />
          </span>
        )}
        {isNow && <span className="now-pill">Teraz</span>}
      </button>
      <div className="time-block-tools" aria-label="Korekta bloku">
        <button type="button" onClick={() => onAdjust(block, -15, -15)} title="Przesuń 15 min wcześniej" aria-label="Przesuń wcześniej">
          <Icon name="up" size={14} />
        </button>
        <button type="button" onClick={() => onAdjust(block, 15, 15)} title="Przesuń 15 min później" aria-label="Przesuń później">
          <Icon name="down" size={14} />
        </button>
        <button type="button" onClick={() => onAdjust(block, 0, -5)} title="Skróć o 5 min" aria-label="Skróć">
          <Icon name="minus" size={14} />
        </button>
        <button type="button" onClick={() => onAdjust(block, 0, 5)} title="Wydłuż o 5 min" aria-label="Wydłuż">
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  );
}
