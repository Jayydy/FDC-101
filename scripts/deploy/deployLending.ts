import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const Lending = await ethers.getContractFactory("PriceFeedLendingV1");
  const verifierAddr = process.env.PRICE_FEED_VERIFIER_ADDRESS || "0x..."; // Placeholder
  const collateralToken = "0x..."; // FLR address
  const stableToken = "0x..."; // Stablecoin address
  const lending = await Lending.deploy(collateralToken, stableToken, verifierAddr);
  await lending.deployed();
  console.log("Lending deployed at:", lending.address);
}

main().catch(console.error);