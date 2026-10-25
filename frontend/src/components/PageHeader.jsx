import { useUser } from "./UserContext.jsx";

const initials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Nagłówek widoku: tytuł, podtytuł (np. data) oraz karta użytkownika
export default function PageHeader({ title, subtitle, children }) {
  const user = useUser();

  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="page-header-right">
        {children}
        <div className="user-card">
          <span className="user-avatar" aria-hidden="true">{initials(user?.name)}</span>
          <span>
            <span className="user-name">{user?.name || "Użytkownik"}</span>
            <span className="user-role">Użytkownik aplikacji</span>
          </span>
        </div>
      </div>
    </header>
  );
}
