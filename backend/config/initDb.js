// Skrypt przygotowujący bazę danych: tworzy bazę (jeśli nie istnieje),
// zakłada tabele (database/schema.sql) i wczytuje dane demo (database/seed.sql).
// Uruchomienie: npm run db:setup  (UWAGA: czyści istniejące dane)
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const databaseDir = path.join(__dirname, "..", "..", "database");

const connectionConfig = (database) =>
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database,
      };

async function ensureDatabase() {
  if (process.env.DATABASE_URL) return; // baza zarządzana zewnętrznie
  const dbName = process.env.DB_NAME || "timemanager";
  const admin = new Client(connectionConfig("postgres"));
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
    console.log(`✔ Utworzono bazę danych "${dbName}"`);
  }
  await admin.end();
}

async function run() {
  await ensureDatabase();
  const client = new Client(connectionConfig(process.env.DB_NAME || "timemanager"));
  await client.connect();

  for (const file of ["schema.sql", "seed.sql"]) {
    const sql = fs.readFileSync(path.join(databaseDir, file), "utf8");
    await client.query(sql);
    console.log(`✔ Wykonano ${file}`);
  }

  await client.end();
  console.log("Baza danych TimeManager jest gotowa.");
}

run().catch((error) => {
  console.error("✖ Nie udało się przygotować bazy danych:", error.message);
  process.exit(1);
});
