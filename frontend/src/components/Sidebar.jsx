import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../services/constants.js";

// Pasek nawigacji (rysunek 3.4) – dostęp do wszystkich widoków z jednego miejsca
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">TimeManager</span>
        <span className="sidebar-tagline">Aplikacja do planowania dnia</span>
      </div>
      <nav className="sidebar-nav" aria-label="Nawigacja główna">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
