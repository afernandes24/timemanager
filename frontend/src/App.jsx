import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { UserProvider } from "./components/UserContext.jsx";
import DayPlanPage from "./pages/DayPlanPage.jsx";
import InboxPage from "./pages/InboxPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import FocusPage from "./pages/FocusPage.jsx";
import HabitsPage from "./pages/HabitsPage.jsx";
import SummaryPage from "./pages/SummaryPage.jsx";
import { storage, KEYS } from "./services/storage.js";
import { NAV_ITEMS } from "./services/constants.js";

// Zapamiętanie ostatnio używanego widoku (zapis pomocniczy w Local Storage)
function useLastView() {
  const location = useLocation();
  const navigate = useNavigate();
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const last = storage.get(KEYS.lastView);
    const known = NAV_ITEMS.some((item) => item.to === last);
    if (location.pathname === "/" && known && last !== "/") navigate(last, { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (restored.current) storage.set(KEYS.lastView, location.pathname);
  }, [location.pathname]);
}

export default function App() {
  useLastView();

  return (
    <ToastProvider>
      <UserProvider>
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<DayPlanPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/zadania" element={<TasksPage />} />
              <Route path="/skupienie" element={<FocusPage />} />
              <Route path="/nawyki" element={<HabitsPage />} />
              <Route path="/podsumowanie" element={<SummaryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </UserProvider>
    </ToastProvider>
  );
}
