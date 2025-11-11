import { expect } from "chai";
import { ethers } from "hardhat";
import { CommodityTrackerV1 } from "../typechain-types";

describe("CommodityTrackerV1", function () {
  let tracker: CommodityTrackerV1;
  let owner: any;
  let supplier: any;

  beforeEach(async function () {
    [owner, supplier] = await ethers.getSigners();

    const Tracker = await ethers.getContractFactory("CommodityTrackerV1");
    tracker = await Tracker.deploy(owner.address);
  });

  it("should register supplier", async function () {
    await tracker.registerSupplier(supplier.address, "Test Supplier");
    const supp = await tracker.suppliers(supplier.address);
    expect(supp.isRegistered).to.be.true;
  });

  it("should attest inventory", async function () {
    await tracker.registerSupplier(supplier.address, "Test Supplier");
    // Mock proof
    await tracker.connect(supplier).attestInventory(1, {
      merkleProof: [],
      data: { responseBody: { abiEncodedData: ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "string"], [100, "Origin"]) } }
    });
    const inv = await tracker.inventories(1);
    expect(inv.quantity).to.equal(100);
  });

  it("should create shipment", async function () {
    await tracker.registerSupplier(supplier.address, "Test Supplier");
    await tracker.connect(supplier).createShipment(ethers.keccak256(ethers.toUtf8Bytes("Origin")), ethers.keccak256(ethers.toUtf8Bytes("Dest")), 50);
    const ship = await tracker.getShipment(1);
    expect(ship.quantity).to.equal(50);
  });

  // Add more tests
});