// Proste ikony SVG używane w interfejsie
const PATHS = {
  edit: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  trash: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  plus: "M12 5v14M5 12h14",
  left: "M15 18l-6-6 6-6",
  right: "M9 6l6 6-6 6",
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  minus: "M5 12h14",
  check: "M5 12l5 5L20 7",
  play: "M8 5v14l11-7z",
  pause: "M8 5v14M16 5v14",
  reset: "M4 4v6h6M20 12a8 8 0 1 1-2.3-5.7L20 9",
  stop: "M6 6h12v12H6z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  bolt: "M13 3L4 14h7l-1 7 9-11h-7z",
};

export default function Icon({ name, size = 16, strokeWidth = 2 }) {
  const filled = name === "play";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
