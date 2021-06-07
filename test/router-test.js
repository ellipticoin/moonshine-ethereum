const { expect } = require("chai");
const { setup } = require("./test-helpers");
const {
  utils: { parseUnits, getContractAddress },
  constants: { MaxUint256 },
} = ethers;

describe("Router", function () {
  let alice, bob, exchange, apples, usd;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [alice, bob] = signers;
    const MockERC20 = await ethers.getContractFactory("MockERC20");
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
    const Router = await ethers.getContractFactory("Router");
    router = await Router.deploy(usd.address);
    await router.deployed();
    await usd.approve(router.address, MaxUint256);
    await apples.approve(router.address, MaxUint256);
    await bananas.approve(router.address, MaxUint256);
    await usd.connect(bob).approve(router.address, MaxUint256);
    await apples.connect(bob).approve(router.address, MaxUint256);
    await bananas.connect(bob).approve(router.address, MaxUint256);
  });

  it("convert", async function () {
    await setup({
      [await alice.getAddress()]: [
        [parseUnits("200"), usd],
        [parseUnits("100"), apples],
        [parseUnits("100"), bananas],
      ],
      [await bob.getAddress()]: [[parseUnits("100"), apples]],
    });

    await router.createPool(
      apples.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    const applePool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );

    await router.createPool(
      bananas.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Banana Liquidity Token",
      "MSXBANANA"
    );
    const bananaPool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(1)
    );

    await router
      .connect(bob)
      .convert(applePool.address, bananaPool.address, parseUnits("100"));
    expect(await bananas.balanceOf(await bob.getAddress())).to.eq(
      "33233233333634235137"
    );
  });

  it("buy", async function () {
    await setup({
      [await alice.getAddress()]: [
        [parseUnits("100"), usd],
        [parseUnits("100"), apples],
      ],
    });
    await router.createPool(
      apples.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    const applePool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );
    await usd.mint(await bob.getAddress(), parseUnits("100"));

    await router.connect(bob).buy(applePool.address, parseUnits("100"));
    expect(await apples.balanceOf(await bob.getAddress())).to.eq(
      "49924887330996494743"
    );
  });

  it("sell", async function () {
    await setup({
      [await alice.getAddress()]: [
        [parseUnits("100"), usd],
        [parseUnits("100"), apples],
      ],
    });
    await router.createPool(
      apples.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    const applePool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );
    await apples.mint(await bob.getAddress(), parseUnits("100"));

    await router.connect(bob).sell(applePool.address, parseUnits("100"));
    expect(await usd.balanceOf(await bob.getAddress())).to.eq(
      "49924887330996494743"
    );
  });

  it("addLiquidity", async function () {
    await setup({
      [await alice.getAddress()]: [
        [parseUnits("100"), usd],
        [parseUnits("100"), apples],
      ],
    });
    await router.createPool(
      apples.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    const applePool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );
    await apples.mint(await alice.getAddress(), parseUnits("100"));
    await usd.mint(await alice.getAddress(), parseUnits("100"));
    await router.addLiquidity(applePool.address, parseUnits("100"));
    expect(await router.baseTokenBalances(applePool.address)).to.eq(
      parseUnits("200")
    );
    expect(await apples.balanceOf(router.address)).to.eq(parseUnits("200"));
    expect(await applePool.balanceOf(await alice.getAddress())).to.eq(
      parseUnits("200")
    );
  });

  it("removeLiquidity", async function () {
    await setup({
      [await alice.getAddress()]: [
        [parseUnits("100"), usd],
        [parseUnits("100"), apples],
      ],
    });
    await router.createPool(
      apples.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    const applePool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );
    await router.removeLiquidity(applePool.address, parseUnits(".5"));
    expect(await applePool.balanceOf(await alice.getAddress())).to.eq(
      parseUnits("50")
    );
    expect(await router.baseTokenBalances(applePool.address)).to.eq(
      parseUnits("50")
    );
    expect(await apples.balanceOf(router.address)).to.eq(parseUnits("50"));
    expect(await usd.balanceOf(await alice.getAddress())).to.eq(
      parseUnits("50")
    );
    expect(await apples.balanceOf(await alice.getAddress())).to.eq(
      parseUnits("50")
    );
  });

  it("removeLiquidity after buy", async function () {
    await setup({
      [await alice.getAddress()]: [
        [parseUnits("100"), usd],
        [parseUnits("100"), apples],
      ],
      [await bob.getAddress()]: [[parseUnits("100"), usd]],
    });
    await router.createPool(
      apples.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Apple Liquidity Token",
      "MSXAPPLE"
    );
    const applePool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );
    await usd.mint(await bob.getAddress(), parseUnits("100"));

    await router.connect(bob).buy(applePool.address, parseUnits("100"));
    expect(await apples.balanceOf(await bob.getAddress())).to.eq(
      "49924887330996494743"
    );
    await router.removeLiquidity(applePool.address, parseUnits("1"));
    expect(await apples.balanceOf(await alice.getAddress())).to.eq(
      "50075112669003505257"
    );
    expect(await usd.balanceOf(await alice.getAddress())).to.eq(
      parseUnits("200")
    );
  });
});
