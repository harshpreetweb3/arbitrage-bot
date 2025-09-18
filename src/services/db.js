const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path
const dbPath = path.resolve(__dirname, "../../database/arbitrage.db");
const db = new sqlite3.Database(dbPath);

// Initialize schema
db.serialize(() => {
  db.run(`
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
    )
  `);
});

// Insert opportunity
function insertOpportunity(opp) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO opportunities 
        (pair, buyOn, sellOn, buyPrice, sellPrice, grossProfit, fees, netProfit, profitUSD) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opp.tokenPair,
        opp.buyExchange,
        opp.sellExchange,
        opp.buyPrice,
        opp.sellPrice,
        opp.grossProfit,
        opp.fees,
        opp.netProfit,
        opp.netProfit // save netProfit as profitUSD for quick lookup
      ],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// Get latest opportunities
function getOpportunities(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM opportunities ORDER BY timestamp DESC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = { insertOpportunity, getOpportunities };
