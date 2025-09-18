const { ethers } = require("ethers");
const tokens = require("../config/tokens");

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)"
];

// PancakeSwap V2 Factory (Ethereum deployment)
const PANCAKE_FACTORY = "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362";

async function getPanCakePrice() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const factory = new ethers.Contract(PANCAKE_FACTORY, FACTORY_ABI, provider);

  // Find the ETH/USDC pair
  const pairAddress = await factory.getPair(tokens.ETH.address, tokens.USDC.address);
  if (pairAddress === ethers.ZeroAddress) {
    throw new Error("Pair does not exist on PancakeSwap");
  }

  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);

  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();

  let price;
  if (token0.toLowerCase() === tokens.ETH.address.toLowerCase()) {
    // ETH is token0
    price =
      (Number(reserve1) / 10 ** tokens.USDC.decimals) /
      (Number(reserve0) / 10 ** tokens.ETH.decimals);
  } else {
    // ETH is token1
    price =
      (Number(reserve0) / 10 ** tokens.USDC.decimals) /
      (Number(reserve1) / 10 ** tokens.ETH.decimals);
  }

  return {
    ETH_USDC: price,
    source: "PancakeSwap V2"
  };
}

module.exports = { getPanCakePrice };
