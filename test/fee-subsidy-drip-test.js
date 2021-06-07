const { expect } = require("chai");
const { setup } = require("./test-helpers");
const {
  utils: { formatUnits, parseUnits, getContractAddress },
  constants: { MaxUint256 },
} = ethers;

describe("FeeSubsityDrip", function () {
  let provider, apples, bananas, alice, bob, drip, usd;

  beforeEach(async function () {
    provider = ethers.getDefaultProvider();
    signers = await ethers.getSigners();
    [alice, bob] = signers;
    const MintableByIssuers = await ethers.getContractFactory(
      "MintableByIssuers"
    );
    dripToken = await MintableByIssuers.deploy("Mock Drip Token", "TEST");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
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
    const WETH9 = await ethers.getContractFactory("WETH9");
    usd = await MockERC20.deploy(
      "US Dollars",
      "USD",
      await alice.getAddress(),
      0
    );
    weth = await WETH9.deploy();
    weth.deposit({ value: parseUnits("0.1") });

    await setup({
      [await alice.getAddress()]: [
        [parseUnits("200"), usd],
        [parseUnits("100"), dripToken],
      ],
    });

    const Router = await ethers.getContractFactory("Router");
    router = await Router.deploy(usd.address);
    await dripToken.approve(router.address, MaxUint256);
    await weth.approve(router.address, MaxUint256);
    await usd.approve(router.address, MaxUint256);
    await apples.approve(router.address, MaxUint256);
    await apples.connect(bob).approve(router.address, MaxUint256);
    await usd.connect(bob).approve(router.address, MaxUint256);

    await router.createPool(
      dripToken.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits("100"),
      "Reward Token Liquidity Token",
      "MSXTEST"
    );
    const dripTokenPool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(0)
    );

    await router.createPool(
      weth.address,
      parseUnits("0.003"),
      parseUnits("100"),
      parseUnits(".1"),
      "WETH Liquidity Token",
      "MSXWETH"
    );
    const wethPool = (await ethers.getContractFactory("Pool")).attach(
      await router.pools(1)
    );

    const Drip = await ethers.getContractFactory(
      "Drip",
      dripTokenPool,
      wethPool
    );
    drip = await Drip.deploy(
      weth.address,
      dripToken.address,
      router.address,
      dripTokenPool.address,
      wethPool.address,
      router.address
    );
    await drip.setMaxRefund(parseUnits("1"));
    await dripToken.grantRole(await dripToken.ISSUER_ROLE(), drip.address);
  });

  describe("drip", async function () {
    it("drips some token and converts it to ETH", async function () {
      await network.provider.send("evm_mine");
      await drip.drip();
      expect(await ethers.provider.getBalance(drip.address)).to.eq(
        "3682741167623634"
      );
    });
  });

  describe("buy", async function () {
    it("refunds the sender ETH required for a trade", async function () {
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
          await router.pools(2)
        );
        await usd.mint(await bob.getAddress(), parseUnits("100"));

        await alice.sendTransaction({
            to: drip.address,
            value: ethers.utils.parseEther("1.0")
        });

        let bobsBalanaceBefore = await bob.getBalance();
        const tx = await router.connect(bob).buyWithSubsity(applePool.address, parseUnits("100"), drip.address)
        // console.log(await tx.wait());
        // const {gasPrice} = tx;
        // const {gasUsed} = await tx.wait()
        // const fee = gasUsed * gasPrice;
        // const bobsBalanaceAferBeforeRefund = bobsBalanaceBefore - fee 
        // const refund = await bob.getBalance() - bobsBalanaceAferBeforeRefund
        // expect(refund).to.eq(830232000987136)
        // console.log(gasUsed * gasPrice);
        let transactionFee = bobsBalanaceBefore - await bob.getBalance();
        expect(transactionFee).to.eq(0)
    });

    it("only refunds the maxRefund", async function () {
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
          await router.pools(2)
        );
        await usd.mint(await bob.getAddress(), parseUnits("100"));

        await alice.sendTransaction({
            to: drip.address,
            value: ethers.utils.parseEther("1.0")
        });

        let bobsBalanaceBefore = await bob.getBalance();
        const dripBalanceBefore = await ethers.provider.getBalance(drip.address)
        await drip.setMaxRefund(parseUnits(".00000001"));
        const tx = await router.connect(bob).buyWithSubsity(applePool.address, parseUnits("100"), drip.address)
        const dripBalanceAfter = await ethers.provider.getBalance(drip.address)
        const refundPaid = dripBalanceBefore - dripBalanceAfter;
        expect(refundPaid).to.eq(parseUnits(".00000001"))
    });
  });
});
