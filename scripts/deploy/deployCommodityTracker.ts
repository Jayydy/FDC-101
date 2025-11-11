import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const Tracker = await ethers.getContractFactory("CommodityTrackerV1");
  const verifierAddr = process.env.COMMODITY_VERIFIER_ADDRESS || "0x..."; // Placeholder
  const tracker = await Tracker.deploy(verifierAddr);
  await tracker.deployed();
  console.log("Commodity Tracker deployed at:", tracker.address);
}

main().catch(console.error);