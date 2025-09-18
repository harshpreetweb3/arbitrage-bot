const { getUniswapV2Price } = require("./priceFetcher");
const { getSushiPrice } = require("./priceFetcherSushi");
const { getUniswapV3Quote } = require("./priceFetcherV3");
const { getPanCakePrice } = require("./priceFetcherPanCake");
const tokens = require("../config/tokens");

async function getAllPrices() {
  try {
    // Fetch in parallel for speed
    const [uniV2, sushi, pancake, v3Quote] = await Promise.all([
      getUniswapV2Price(),
      getSushiPrice(),
      getPanCakePrice(),
      getUniswapV3Quote({
        tokenIn: tokens.ETH.address,
        tokenOut: tokens.USDC.address,
        amountInHuman: "1",
        tokenInDecimals: 18,
        tokenOutDecimals: 6,
        fee: 500, // 0.05% pool
      }),
    ]);

    const uniV3 = {
      ETH_USDC: v3Quote.amountOut / 1, // USDC per 1 ETH
      source: "Uniswap V3 (0.05% pool)",
    };

    return {
      uniswapV2: uniV2,
      sushiswap: sushi,
      pancakeswap: pancake,
      uniswapV3: uniV3,
    };
  } catch (err) {
    throw new Error("Error fetching prices: " + err.message);
  }
}

module.exports = { getAllPrices };
