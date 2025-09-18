const express = require("express");
const router = express.Router();
const db = require("../services/db");
const tokens = require("../config/tokens");
const { getUniswapV2Price } = require("../services/priceFetcher");
const { getUniswapV3Quote } = require("../services/priceFetcherV3");
const { getSushiPrice } = require("../services/priceFetcherSushi");
const { getAllPrices } = require("../services/priceAggregator");
const { getPanCakePrice } = require("../services/priceFetcherPanCake");
const { findArbitrageOpportunities } = require("../services/arbitrageEngine");


// test route

router.get("/ping", (req, res) => {
  res.json({ message: "API is alive 🚀" });
});

// insert dummy opportunity
router.post("/opportunities", async (req, res) => {
  const { pair, buyOn, sellOn, profitUSD } = req.body;
  if (!pair || !buyOn || !sellOn || !profitUSD) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const id = await db.insertOpportunity(pair, buyOn, sellOn, profitUSD);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get recent opportunities
router.get("/opportunities", async (req, res) => {
  try {
    const rows = await db.getOpportunities(10);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// fetch ETH/USDC price from Uniswap V2
router.get("/price/v2", async (req, res) => {
  try {
    const price = await getUniswapV2Price();
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/price/v3
router.get("/price/v3", async (req, res) => {
  try {
    const result = await getUniswapV3Quote({
      tokenIn: tokens.ETH.address,
      tokenOut: tokens.USDC.address,
      amountInHuman: "1",
      tokenInDecimals: 18,
      tokenOutDecimals: 6,
      fee: 500 // 0.05% pool
    });

    res.json({ price: result.amountOut });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/price/sushi
router.get("/price/sushi", async (req, res) => {
  try {
    const price = await getSushiPrice();
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/price/pancake
router.get("/price/pancake", async (req, res) => {
  try {
    const price = await getPanCakePrice();
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET /api/price/all
router.get("/price/all", async (req, res) => {
  try {
    const prices = await getAllPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/arbitrage", async (req, res) => {
  try {
    const prices = await getAllPrices();
    const opportunities = await findArbitrageOpportunities(prices);

    if (opportunities.length === 0) {
      return res.json({ message: "No profitable opportunities found" });
    }

    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
