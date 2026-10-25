import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import QuickAddTask from "../components/QuickAddTask.jsx";
import TodayTasks from "../components/TodayTasks.jsx";
import HabitList from "../components/HabitList.jsx";
import DayPlan from "../components/DayPlan.jsx";
import FocusMiniCard from "../components/FocusMiniCard.jsx";
import SummaryPanel from "../components/SummaryPanel.jsx";
import MethodsBar from "../components/MethodsBar.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../services/api.js";
import { formatLongDate, todayISO } from "../services/dateUtils.js";

// Widok główny (rysunek 3.3): szybkie dodawanie, zadania dnia, plan dnia,
// tryb skupienia, nawyki i podsumowanie dostępne z jednego poziomu
export default function DayPlanPage() {
  const notify = useToast();
  const [date, setDate] = useState(todayISO);
  const [dayTasks, setDayTasks] = useState([]);
  const [openTasks, setOpenTasks] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tasksForDay, dayBlocks, dayHabits, daySummary, allTasks] = await Promise.all([
        api.tasks.forDay(date),
        api.blocks.list(date),
        api.habits.list(date),
        api.summary(date),
        api.tasks.list({ sort: "priority" }),
      ]);
      setDayTasks(tasksForDay);
      setBlocks(dayBlocks);
      setHabits(dayHabits);
      setSummary(daySummary);
      setOpenTasks(allTasks.filter((t) => t.status !== "done"));
      setOffline(false);
    } catch (error) {
      setOffline(true);
      notify(error.message, "error");
    }
  }, [date, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTask = async (task) => {
    try {
      await api.tasks.setStatus(task.id, task.status === "done" ? "new" : "done");
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const toggleHabit = async (habit) => {
    try {
      await api.habits.log(habit.id, date, !habit.completed);
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <div className="page">
      <PageHeader title="Plan dnia" subtitle={formatLongDate(todayISO())} />

      {offline && (
        <div className="banner banner-error">
          Brak połączenia z serwerem API. Uruchom backend (npm run dev w katalogu backend) i odśwież stronę.
        </div>
      )}

      <QuickAddTask onAdded={load} />

      <div className="dashboard-grid">
        <div className="dashboard-col">
          <TodayTasks
            tasks={dayTasks}
            onToggle={toggleTask}
            title={date === todayISO() ? "Dzisiejsze zadania" : "Zadania dnia"}
          />
          <HabitList habits={habits} onToggle={toggleHabit} />
        </div>

        <DayPlan date={date} onDateChange={setDate} blocks={blocks} tasks={openTasks} onChanged={load} />

        <div className="dashboard-col">
          <FocusMiniCard tasks={[...dayTasks, ...openTasks]} />
          <SummaryPanel summary={summary} />
        </div>
      </div>

      <MethodsBar />
    </div>
  );
}
