// TimeManager – serwer API (Node.js + Express)
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const { currentUser } = require("./config/auth");
const taskRoutes = require("./routes/taskRoutes");
const timeBlockRoutes = require("./routes/timeBlockRoutes");
const focusSessionRoutes = require("./routes/focusSessionRoutes");
const habitRoutes = require("./routes/habitRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Sprawdzenie działania serwera i połączenia z bazą
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// Endpointy API – każde żądanie jest przypisywane do konta użytkownika
app.use("/api", currentUser);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/time-blocks", timeBlockRoutes);
app.use("/api/focus-sessions", focusSessionRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/summary", summaryRoutes);

app.use("/api", (req, res) => res.status(404).json({ message: "Nie znaleziono endpointu" }));

// Wersja produkcyjna: serwowanie zbudowanego frontendu (frontend/dist)
const distPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
}

// Obsługa błędów (np. niepoprawny JSON w żądaniu)
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Niepoprawny format danych (JSON)" });
  }
  console.error(error);
  res.status(500).json({ message: "Wewnętrzny błąd serwera" });
});

app.listen(PORT, () => {
  console.log(`Serwer TimeManager działa na http://localhost:${PORT}`);
});
