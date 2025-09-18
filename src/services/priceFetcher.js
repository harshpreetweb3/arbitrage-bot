const { ethers } = require("ethers");
const tokens = require("../config/tokens");
const pairABI = require("../config/uniswapV2PairABI.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const UNISWAP_V2_ETH_USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"; // ETH/USDC

async function getUniswapV2Price() {
  const pair = new ethers.Contract(UNISWAP_V2_ETH_USDC_PAIR, pairABI, provider);

  const [reserve0, reserve1] = await pair.getReserves();

  // reserve0 = USDC (6 decimals), reserve1 = WETH (18 decimals)
  const reserve0Num = parseFloat(ethers.formatUnits(reserve0, 6));  // USDC
  const reserve1Num = parseFloat(ethers.formatUnits(reserve1, 18)); // ETH

  // Price of 1 ETH in USDC
  const priceETHinUSDC = reserve0Num / reserve1Num;

  // Price of 1 USDC in ETH
  const priceUSDCinETH = reserve1Num / reserve0Num;

  return {
    ETH_USDC: priceETHinUSDC,
    USDC_ETH: priceUSDCinETH,
  };
}

module.exports = { getUniswapV2Price };
