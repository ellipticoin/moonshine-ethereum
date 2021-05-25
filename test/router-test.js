const { expect } = require("chai");
const {
  utils: { parseUnits, getContractAddress },
  constants: { MaxUint256 },
} = ethers;

describe.only("Router", function () {
  let alice, bob, exchange, apples, usd;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [alice, bob] = signers;
    const Router = await ethers.getContractFactory("Router");
    const MockERC20 = await ethers.getContractFactory("ERC20Mock");
    usd = await MockERC20.deploy(
      "US Dollars",
      "USD",
      await alice.getAddress(),
      0
    );
    apples = await MockERC20.deploy(
      "Apples",
      "APPLES",
      await alice.getAddress(),
      0
    );
    bananas = await MockERC20.deploy(
      "Bananas",
      "BANANAS",
      await alice.getAddress(),
      0
    );
    router = await Router.deploy(usd.address);
  });

  async function setup(
    deployer,
    { initalTokenAmount, initialBaseTokenAmount }
  ) {
    const Exchange = await ethers.getContractFactory("Exchange");
    await usd.mint(await deployer.getAddress(), initialBaseTokenAmount);
    await apples.mint(await deployer.getAddress(), initalTokenAmount);
    const exchangeAddress = getContractAddress({
      from: await deployer.getAddress(),
      nonce: (await deployer.getTransactionCount()) + 3,
    });
    await usd.approve(exchangeAddress, MaxUint256);
    await apples.approve(exchangeAddress, MaxUint256);
    await bananas.approve(exchangeAddress, MaxUint256);
    exchange = await Exchange.deploy(
      usd.address,
      apples.address,
      initialBaseTokenAmount,
      initalTokenAmount,
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    await exchange.deployed();
    await usd.connect(bob).approve(exchange.address, MaxUint256);
    await apples.connect(bob).approve(exchange.address, MaxUint256);
    await bananas.connect(bob).approve(exchange.address, MaxUint256);
  }

  it("createExchange", async function () {
    console.log("createExchange")
  })
});
