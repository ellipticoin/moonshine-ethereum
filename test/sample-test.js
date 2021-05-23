const { expect } = require("chai");
const { utils: {parseUnits, getContractAddress}, constants: {MaxUint256} } = ethers;

describe("Exchange", function () {
  let alice, bob, exchange, apples, usd
  beforeEach(async function () {
    signers = await ethers.getSigners();
    [alice, bob] = signers;
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
    const Exchange = await ethers.getContractFactory("Exchange");
    await usd.mint(await alice.getAddress(), parseUnits("100"));
    await apples.mint(await alice.getAddress(), parseUnits("100"));
    const exchangeAddress = getContractAddress({
        from: await alice.getAddress(),
        nonce: await alice.getTransactionCount() + 3
    })
    await usd.approve(exchangeAddress, MaxUint256);
    await apples.approve(exchangeAddress, MaxUint256);
    await bananas.approve(exchangeAddress, MaxUint256);
    exchange = await Exchange.deploy(
      usd.address,
      apples.address,
      parseUnits("100"),
      parseUnits("100")
    );
    await exchange.deployed();
    await usd.connect(bob).approve(exchange.address, MaxUint256);
    await apples.connect(bob).approve(exchange.address, MaxUint256);
    await bananas.connect(bob).approve(exchange.address, MaxUint256);
  })

  it("buy", async function () {
    await usd.mint(await bob.getAddress(), parseUnits("100"));
    

    await exchange.connect(bob).buy(parseUnits("100"));
    expect(await apples.balanceOf(await bob.getAddress())).to.eq(
      "49924887330996494743"
    );
  });

  it("sell", async function () {
    await apples.mint(await bob.getAddress(), parseUnits("100"));

    await exchange.connect(bob).sell(parseUnits("100"));
    expect(await usd.balanceOf(await bob.getAddress())).to.eq(
      "49924887330996494743"
    );
  });

  it("addLiquidity", async function () {
    await apples.mint(await alice.getAddress(), parseUnits("100"));
    await usd.mint(await alice.getAddress(), parseUnits("100"));
    await exchange.addLiquidity(parseUnits("100"));
    expect(await usd.balanceOf(exchange.address)).to.eq(parseUnits("200"))
    expect(await apples.balanceOf(exchange.address)).to.eq(parseUnits("200"))
  })

  it("removeLiquidity", async function () {
    await apples.mint(await alice.getAddress(), parseUnits("100"));
    await usd.mint(await alice.getAddress(), parseUnits("100"));
    await exchange.addLiquidity(parseUnits("100"));
    expect(await usd.balanceOf(exchange.address)).to.eq(parseUnits("200"))
    expect(await apples.balanceOf(exchange.address)).to.eq(parseUnits("200"))
  })

  it("remove liquidity after trade", async function () {
    await usd.mint(await bob.getAddress(), parseUnits("100"));
    

    await exchange.connect(bob).buy(parseUnits("100"));
    expect(await apples.balanceOf(await bob.getAddress())).to.eq(
      "49924887330996494743"
    );
  });
});
