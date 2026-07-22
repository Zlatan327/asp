import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("BountyPool", function () {
  async function deployBountyPoolFixture() {
    const [deployer, verifier, feeRecipient, creator, user] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20Factory.deploy("Mock USDT", "mUSDT", 6);
    await mockToken.waitForDeployment();

    const BountyPoolFactory = await ethers.getContractFactory("BountyPool");
    const bountyPool = await BountyPoolFactory.deploy(
      mockToken.target,
      verifier.address,
      feeRecipient.address
    );
    await bountyPool.waitForDeployment();

    // Give creator some tokens to fund the pool
    await mockToken.mint(creator.address, ethers.parseUnits("1000", 6));

    return { bountyPool, mockToken, deployer, verifier, feeRecipient, creator, user };
  }

  describe("Deployment", function () {
    it("should deploy correctly", async function () {
      const { bountyPool, verifier, feeRecipient } = await loadFixture(deployBountyPoolFixture);
      expect(await bountyPool.backendVerifier()).to.equal(verifier.address);
      expect(await bountyPool.feeRecipient()).to.equal(feeRecipient.address);
      expect(await bountyPool.platformFeeBps()).to.equal(200);
    });
  });

  describe("Creating Pools", function () {
    it("should allow creating a pool", async function () {
      const { bountyPool, mockToken, creator } = await loadFixture(deployBountyPoolFixture);
      const bountyId = ethers.id("test-bounty");
      const totalAmount = ethers.parseUnits("100", 6);
      const rewardPerClaim = ethers.parseUnits("10", 6);

      await mockToken.connect(creator).approve(bountyPool.target, totalAmount);
      await bountyPool.connect(creator).createPool(bountyId, totalAmount, rewardPerClaim);

      const pool = await bountyPool.pools(bountyId);
      expect(pool.totalAmount).to.equal(totalAmount);
      expect(pool.rewardPerClaim).to.equal(rewardPerClaim);
    });
  });

  describe("Distributing Rewards", function () {
    it("should distribute reward and deduct fee", async function () {
      const { bountyPool, mockToken, verifier, feeRecipient, creator, user } = await loadFixture(deployBountyPoolFixture);
      
      const bountyId = ethers.id("test-bounty-2");
      const totalAmount = ethers.parseUnits("100", 6);
      const rewardPerClaim = ethers.parseUnits("10", 6);

      await mockToken.connect(creator).approve(bountyPool.target, totalAmount);
      await bountyPool.connect(creator).createPool(bountyId, totalAmount, rewardPerClaim);

      const feeBalanceBefore = await mockToken.balanceOf(feeRecipient.address);
      const userBalanceBefore = await mockToken.balanceOf(user.address);

      await bountyPool.connect(verifier).distributeReward(bountyId, user.address);

      const feeBalanceAfter = await mockToken.balanceOf(feeRecipient.address);
      const userBalanceAfter = await mockToken.balanceOf(user.address);

      // Fee is 2% of 10 = 0.2
      const expectedFee = ethers.parseUnits("0.2", 6);
      const expectedUserAmount = ethers.parseUnits("9.8", 6);

      expect(feeBalanceAfter - feeBalanceBefore).to.equal(expectedFee);
      expect(userBalanceAfter - userBalanceBefore).to.equal(expectedUserAmount);
    });
  });
});
