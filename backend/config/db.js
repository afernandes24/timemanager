// Konfiguracja połączenia z bazą danych PostgreSQL
const { Pool, types } = require("pg");
require("dotenv").config();

// Typy DATE (1082) i TIMESTAMP (1114) zwracamy jako tekst,
// aby uniknąć przesunięć stref czasowych między serwerem a przeglądarką.
types.setTypeParser(1082, (value) => value);
types.setTypeParser(1114, (value) => value);

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "timemanager",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    });

pool.on("error", (error) => {
  console.error("Nieoczekiwany błąd połączenia z bazą danych:", error.message);
});

module.exports = pool;
