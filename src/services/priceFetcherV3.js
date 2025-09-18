// src/services/priceFetcherV3.js
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Quoter (mainnet) — check docs if you move networks
const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
// Minimal ABI for quoteExactInputSingle
const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256)"
];

const quoterIface = new ethers.Interface(QUOTER_ABI);

async function getUniswapV3Quote({ tokenIn, tokenOut, amountInHuman, tokenInDecimals, tokenOutDecimals, fee }) {
  // amountInHuman: string or number, e.g. "1" for 1 ETH
  try {
    // parse input amount into token decimals (BigInt)
    const amountIn = ethers.parseUnits(amountInHuman.toString(), tokenInDecimals); // BigInt

    // encode calldata
    const data = quoterIface.encodeFunctionData("quoteExactInputSingle", [
      tokenIn,
      tokenOut,
      fee,        // uint24: 500 / 3000 / 10000
      amountIn,   // uint256
      0           // sqrtPriceLimitX96 (0 for no limit)
    ]);

    // simulate call via eth_call
    const res = await provider.call({ to: QUOTER_ADDRESS, data });

    // decode returned amountOut (uint256)
    const [amountOut] = quoterIface.decodeFunctionResult("quoteExactInputSingle", res);

    // convert to human readable number
    const amountOutFloat = parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals));

    return {
      amountOut: amountOutFloat,   // e.g. USDC amount from swapping `amountInHuman` tokenIn
      rawAmountOut: amountOut,     // BigInt
      fee
    };
  } catch (err) {
    // pool may not exist for this fee tier or quoter can revert — handle gracefully
    // console.error("V3 quote error:", err?.message || err);
    throw err;
  }
}

module.exports = { getUniswapV3Quote };
