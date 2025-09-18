# DeFi Arbitrage Bot 

### What this project does
- **Fetches token prices** in real-time from multiple Uniswap V2–compatible DEXs: Uniswap V2, Sushiswap, PancakeSwap V2, and also Uniswap V3 via the Quoter.
- **Identifies arbitrage opportunities** where the cross-exchange price spread exceeds estimated swap + gas fees plus a safety margin.
- **Calculates potential profit** and records profitable opportunities in a local SQLite database.
- **Simulates the trade** (no on-chain execution) and exposes a **REST API** to fetch prices and recent opportunities.

---

### Project layout
```
src/
  index.js                 # Express server
  api/routes.js            # REST API routes
  services/
    priceFetcher.js        # Uniswap V2 (reserves → price)
    priceFetcherSushi.js   # Sushiswap V2 (reserves → price)
    priceFetcherPanCake.js # PancakeSwap V2 (factory + reserves → price)
    priceFetcherV3.js      # Uniswap V3 Quoter (eth_call quote)
    priceAggregator.js     # Parallel fetch and normalization
    arbitrageEngine.js     # Opportunity detection + simulation + DB write
    db.js                  # SQLite schema + helpers
  config/tokens.js         # Token addresses/decimals (ETH/WETH, USDC, DAI)
database/
  arbitrage.db             # SQLite database file (auto-created)
  schema.sql               # Reference schema
```

---

### Requirements
- Node.js 18+ (recommended)
- An Ethereum JSON-RPC endpoint (e.g., Alchemy, Infura, or local node)

Environment variables (create a `.env` in the project root):
```
RPC_URL=YOUR_ETHEREUM_RPC_ENDPOINT
# Optional
PORT=3000
```

Notes:
- The code uses `ethers@6` and calls mainnet contracts by default.
- The database file is created at `database/arbitrage.db` on first run.

---

### Install and run
```bash
# from the project root
npm install

# run the API server
npm start
# or: node src/index.js
```

When the server is up:
- Root: `GET http://localhost:3000/` → "Server is running 🚀"
- API base: `http://localhost:3000/api`

---

### REST API

- `GET /api/ping` — health check.
- `GET /api/price/v2` — Uniswap V2 ETH/USDC price via reserves.
- `GET /api/price/sushi` — Sushiswap V2 ETH/USDC price via reserves.
- `GET /api/price/pancake` — PancakeSwap V2 ETH/USDC price via factory + reserves.
- `GET /api/price/v3` — Uniswap V3 quote for swapping 1 ETH → USDC (0.05% pool) via Quoter.
- `GET /api/price/all` — fetches all of the above in parallel and returns a combined object.
- `GET /api/arbitrage` — fetches prices and returns currently profitable simulated opportunities; also persists them to SQLite.
- `GET /api/opportunities` — latest saved opportunities from the database (default 10).
- `POST /api/opportunities` — insert a dummy opportunity for testing.

Example calls
```bash
# health
curl http://localhost:3000/api/ping

# prices
curl http://localhost:3000/api/price/v2
curl http://localhost:3000/api/price/v3
curl http://localhost:3000/api/price/sushi
curl http://localhost:3000/api/price/pancake
curl http://localhost:3000/api/price/all

# simulate arbitrage and save profitable opportunities (no real trades executed)
curl http://localhost:3000/api/arbitrage

# recent opps from DB
curl http://localhost:3000/api/opportunities

# insert a dummy row
curl -X POST http://localhost:3000/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{"pair":"ETH/USDC","buyOn":"uniswapV2","sellOn":"sushiswap","profitUSD":1.23}'
```

---

### How pricing works
Prices are normalized to “USDC per 1 ETH”.

- **Uniswap/Sushiswap/Pancake V2**: Read `getReserves()` from the pair and compute
  - `priceETHinUSDC = reserveUSDC / reserveETH` adjusting for decimals (USDC 6, ETH 18).
- **Uniswap V3**: Use the Quoter contract’s `quoteExactInputSingle` via `eth_call` for swapping 1 ETH to USDC in the 0.05% pool; decode the `amountOut` and convert to a float.

---

### Arbitrage logic and calculations
File: `src/services/arbitrageEngine.js`

Given prices for a token pair across exchanges, we simulate buying on one and selling on another for a fixed amount of 1 ETH and compute:

- **Gross profit**: `(sellPrice - buyPrice) * tradeAmount` (USD)
- **Fees**: `gasCostUSD + swapFeeRate * buyPrice * tradeAmount`
  - In this demo, `gasCostUSD = 0.5` and `swapFeeRate = 0.0005` (0.05%) are conservative testing defaults.
- **Safety margin**: a small buffer proportional to notional, here `0.01%` of the notional (`buyPrice * tradeAmount`).
- **Net profit**: `grossProfit - fees`
- **Profitability check**: `netProfit > safetyMargin`

When an opportunity is profitable, it is appended to the response and inserted into SQLite with full context: `buyOn`, `sellOn`, `buyPrice`, `sellPrice`, `grossProfit`, `fees`, `netProfit`, and `timestamp`.

This is a pure simulation — no on-chain transactions are broadcast.

---

### Database
- SQLite database lives at `database/arbitrage.db` and is initialized automatically on boot with the `opportunities` table.
- You can inspect it with any SQLite client. Example (PowerShell):
```bash
# install a CLI if you do not have one, then:
sqlite3 database/arbitrage.db ".schema opportunities"
```

Schema columns:
- `pair`, `buyOn`, `sellOn`, `buyPrice`, `sellPrice`, `grossProfit`, `fees`, `netProfit`, `profitUSD`, `timestamp`

---

### Assumptions and limitations
- Targets mainnet contract addresses for WETH/USDC pools; ensure your `RPC_URL` is Ethereum mainnet.
- Uses simplified fee and gas estimates for demonstration purposes; real execution requires dynamic gas estimation, pool fee tiers, slippage limits, and MEV considerations.
- No private key handling; the service is read-only and does not execute trades.

---

### Troubleshooting
- If you see RPC errors, verify `RPC_URL` and that your provider allows `eth_call` to the Uniswap V3 Quoter.
- If prices are `null` for PancakeSwap, the ETH/USDC pair may not exist on the target network/address; confirm mainnet addresses and connectivity.
- On Windows PowerShell, set env var for the current session:
```powershell
$env:RPC_URL="https://mainnet.infura.io/v3/<YOUR_KEY>"
node src/index.js
```

---

### License
ISC (see `package.json`).
