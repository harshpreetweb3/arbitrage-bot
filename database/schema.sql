CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pair TEXT NOT NULL,
      buyOn TEXT NOT NULL,
      sellOn TEXT NOT NULL,
      buyPrice REAL,
      sellPrice REAL,
      grossProfit REAL,
      fees REAL,
      netProfit REAL,
      profitUSD REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

-- CREATE TABLE IF NOT EXISTS opportunities (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   pair TEXT NOT NULL,
--   buyOn TEXT NOT NULL,
--   sellOn TEXT NOT NULL,
--   profitUSD REAL NOT NULL,
--   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
-- );
