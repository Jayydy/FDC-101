import { expect } from "chai";
import { ethers } from "hardhat";

describe("PriceFeedLendingV1", function () {
  let lending: any;
  let collateralToken: any;
  let stableToken: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    collateralToken = await MockERC20.deploy("Collateral", "COLL");
    stableToken = await MockERC20.deploy("Stable", "STAB");

    const Lending = await ethers.getContractFactory("PriceFeedLendingV1");
    lending = await Lending.deploy(collateralToken.address, stableToken.address, owner.address);

    // Mint tokens
    await collateralToken.mint(user.address, ethers.parseEther("1000"));
    await stableToken.mint(lending.address, ethers.parseEther("1000"));
  });

  it("should deposit collateral", async function () {
    await collateralToken.connect(user).approve(lending.address, ethers.parseEther("100"));
    await lending.connect(user).deposit(ethers.parseEther("100"));
    expect(await lending.collateralBalances(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("should borrow stablecoins", async function () {
    // Set price
    await lending.updatePriceWithProof({
      merkleProof: [],
      data: { responseBody: { abiEncodedData: ethers.toUtf8Bytes("100000000") } } // Mock proof
    });

    await collateralToken.connect(user).approve(lending.address, ethers.parseEther("200"));
    await lending.connect(user).deposit(ethers.parseEther("200"));
    await lending.connect(user).borrow(ethers.parseEther("50"));
    expect(await lending.borrowBalances(user.address)).to.equal(ethers.parseEther("50"));
  });

  it("should repay loan", async function () {
    // Similar setup
    await lending.connect(user).repay(ethers.parseEther("50"));
    expect(await lending.borrowBalances(user.address)).to.equal(0);
  });

  // Add more tests for liquidate, etc.
});