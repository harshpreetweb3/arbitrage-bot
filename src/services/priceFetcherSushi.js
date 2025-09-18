const { ethers } = require("ethers");
const tokens = require("../config/tokens");
const pairABI = require("../config/uniswapV2PairABI.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Sushiswap WETH/USDC pair
const SUSHISWAP_ETH_USDC_PAIR = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0";

async function getSushiPrice() {
  const pair = new ethers.Contract(SUSHISWAP_ETH_USDC_PAIR, pairABI, provider);
  const [reserve0, reserve1] = await pair.getReserves();

  const reserve0Num = parseFloat(ethers.formatUnits(reserve0, 6));  // USDC
  const reserve1Num = parseFloat(ethers.formatUnits(reserve1, 18)); // ETH

  const priceETHinUSDC = reserve0Num / reserve1Num;

  return {
    ETH_USDC: priceETHinUSDC,
    source: "Sushiswap"
  };
}

module.exports = { getSushiPrice };
