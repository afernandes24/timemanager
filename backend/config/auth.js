// Autoryzacja użytkownika (wersja podstawowa).
// Każde żądanie do API jest przypisywane do konta użytkownika, dzięki czemu
// użytkownik widzi wyłącznie własne zadania, bloki czasu, sesje i nawyki.
// Pełne logowanie (rejestracja, hasło, token) jest wskazane w pracy
// jako kierunek dalszego rozwoju – tu używany jest użytkownik demonstracyjny.
const pool = require("./db");

const currentUser = async (req, res, next) => {
  const userId = Number(req.get("X-User-Id") || process.env.DEMO_USER_ID || 1);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({ message: "Nieprawidłowy identyfikator użytkownika" });
  }

  try {
    const result = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Użytkownik nie istnieje" });
    }
    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ message: "Brak połączenia z bazą danych" });
  }
};

module.exports = { currentUser };
