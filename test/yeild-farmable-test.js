const { expect } = require("chai");
const { setup } = require("./test-helpers");
const {
  utils: { parseUnits, getContractAddress },
  constants: { AddressZero },
} = ethers;
const ERC20JSON = require("@openzeppelin/contracts/build/contracts/ERC20");

describe("YieldFarmable", function () {
  let alice, bob, pool, apples, usd;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [alice, bob] = signers;
    const YieldFarmableToken = await ethers.getContractFactory(
      "MockYieldFarmableERC20"
    );
    const MintableByIssuers = await ethers.getContractFactory(
      "MintableByIssuers"
    );
    rewardToken = await MintableByIssuers.deploy(
      "Mock YieldFarmable Token",
      "TEST"
    );
    token = await YieldFarmableToken.deploy(
      "Mock YieldFarmable Token",
      "TEST",
      rewardToken.address
    );
    await rewardToken.grantRole(await rewardToken.ISSUER_ROLE(), token.address);
  });

  describe("getPendingYield", function () {
    it("starts at zero", async function () {
      expect(await token.getPendingYield(await alice.getAddress())).to.eq(
        parseUnits("0")
      );
    });

    it("increments by 1 every second", async function () {
      await token.mint(await alice.getAddress(), parseUnits("1"));
      await network.provider.send("evm_mine");
      expect(await token.getPendingYield(await alice.getAddress())).to.eq(
        parseUnits("3")
      );
    });
  });

  describe("harvest", function () {
    it("pays out the sender their reward", async function () {
      await token.mint(await alice.getAddress(), parseUnits("1"));
      await token.harvest();
      const rewardToken = new ethers.Contract(
        await token.rewardToken(),
        ERC20JSON.abi,
        alice
      );
      expect(await rewardToken.balanceOf(await alice.getAddress())).to.eq(
        parseUnits("3")
      );
    });

    it("resets their pending yeild", async function () {
      await network.provider.send("evm_mine");
      await token.mint(await alice.getAddress(), parseUnits("1"));
      await token.harvest();
      expect(await token.getPendingYield(await alice.getAddress())).to.eq("0");
    });

    it("increments yieldHarvested", async function () {
      await token.mint(await alice.getAddress(), parseUnits("1"));
      await token.harvest();
      expect(await token.yieldHarvested(await alice.getAddress())).to.eq(
        parseUnits("3")
      );
    });

    it("increments totalYieldPerToken", async function () {
      await token.mint(await alice.getAddress(), parseUnits("1"));
      await token.harvest();
      expect(await token.totalYieldPerToken()).to.eq(parseUnits(".000003"));
    });

    it("splits rewards amoungst liquidity providers", async function () {
      await token.mint(await alice.getAddress(), parseUnits("1"));
      await token.mint(await bob.getAddress(), parseUnits("2"));
      await token.harvest();
      await token.connect(bob).harvest();
      const rewardToken = new ethers.Contract(
        await token.rewardToken(),
        ERC20JSON.abi,
        alice
      );
      expect(await rewardToken.balanceOf(await alice.getAddress())).to.eq(
        parseUnits("3.333333333333000000")
      );
      expect(await rewardToken.balanceOf(await bob.getAddress())).to.eq(
        parseUnits("7.333333333332000000")
      );
      expect(await token.getPendingYield(await alice.getAddress())).to.eq(
        parseUnits("0.333333333333000000")
      );
      expect(await token.getPendingYield(await bob.getAddress())).to.eq("0");
    });
  });
});
