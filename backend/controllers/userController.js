// Kontroler użytkownika – dane zalogowanego (demonstracyjnego) użytkownika
const pool = require("../config/db");

// GET /api/users/me
const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.userId]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania danych użytkownika" });
  }
};

module.exports = { getCurrentUser };
