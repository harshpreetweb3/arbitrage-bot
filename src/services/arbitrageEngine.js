// src/services/arbitrageEngine.js
const { insertOpportunity } = require("./db");

async function findArbitrageOpportunities(prices) {
  const opportunities = [];
  const tokenPair = "ETH/USDC";
  const tradeAmount = 1; // Simulate 1 ETH trade

  // 🔧 Reduced thresholds for testing
  const gasCostUSD = 0.5;           // lowered from 2.5
  const swapFeeRate = 0.0005;       // 0.05% fee instead of 0.3%
  const safetyMargin = 0.0001 * tradeAmount * prices.uniswapV2.ETH_USDC; 
  // 0.01% buffer

  const exchanges = Object.keys(prices);

  for (let i = 0; i < exchanges.length; i++) {
    for (let j = 0; j < exchanges.length; j++) {
      if (i === j) continue;

      const buyExchange = exchanges[i];
      const sellExchange = exchanges[j];

      const buyPrice = prices[buyExchange]?.ETH_USDC;
      const sellPrice = prices[sellExchange]?.ETH_USDC;

      if (!buyPrice || !sellPrice) continue;

      const grossProfit = (sellPrice - buyPrice) * tradeAmount;
      const fees = gasCostUSD + (swapFeeRate * buyPrice * tradeAmount);
      const netProfit = grossProfit - fees;

      const isProfitable = netProfit > safetyMargin;

      if (isProfitable) {
        const opportunity = {
          tokenPair,
          buyExchange,
          buyPrice,
          sellExchange,
          sellPrice,
          tradeAmount,
          grossProfit,
          fees,
          netProfit,
          isProfitable,
          simulatedTrade: {
            status: "SIMULATED_SUCCESS",
            buyOn: buyExchange,
            sellOn: sellExchange,
            amount: tradeAmount,
            expectedProfitUSD: netProfit.toFixed(4),
            notes: `Simulated trade: Buy ${tradeAmount} ETH on ${buyExchange}, sell on ${sellExchange}`
          }
        };

        opportunities.push(opportunity);

        // ✅ Save profitable opportunity to DB
        try {
          await insertOpportunity(opportunity);
        } catch (err) {
          console.error("❌ Failed to insert opportunity into DB:", err.message);
        }
      }
    }
  }

  return opportunities;
}

module.exports = { findArbitrageOpportunities };
