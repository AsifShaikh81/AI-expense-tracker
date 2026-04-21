import { Database } from "bun:sqlite";

export function initDB(dbPath: string): Database {
  const database = new Database(dbPath || ":memory:");
  const query = `
    CREATE TABLE IF NOT EXISTS expenses(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL
    )`;
  database.run(query);
  return database;
}
