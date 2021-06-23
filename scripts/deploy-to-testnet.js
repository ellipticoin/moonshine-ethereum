const hre = require("hardhat");
const {
  utils: { parseUnits },
  constants: { MaxUint256 },
} = ethers;

async function main() {
  signers = await ethers.getSigners();
  let tx;
  const WETH_ADDRESS = "0xa859A8E8d95627605e2CfD68A1De8ecB4C1eFf8E";
  // const WETH_ADDRESS = "0xc778417e063141139fce010982780140aa0cd5ab";
  const weth = (await hre.ethers.getContractFactory("WETH9")).attach(
    WETH_ADDRESS
  );
  // const WETH9 = await hre.ethers.getContractFactory("WETH9");
  // const weth = await WETH9.deploy();
  // await weth.deployed();
  // const weth = (await hre.ethers.getContractFactory("WETH9")).attach(
  signers = await ethers.getSigners();
  const MintableERC20 = await hre.ethers.getContractFactory("MintableERC20");
  const usdc = await MintableERC20.deploy("USD Coin", "USDC", 6);
  const msx = await MintableERC20.deploy("Moonshine", "MSX", 6);
  const wbtc = await MintableERC20.deploy("Wrapped Bitcoin", "WBTC", 8);
  await Promise.all([usdc.deployed(), msx.deployed(), wbtc.deployed()]);
  const msxMintTx = await msx.mint(
    await signers[0].getAddress(),
    parseUnits("2500", await msx.decimals())
  );
  const usdcMintTx = await usdc.mint(
    await signers[0].getAddress(),
    parseUnits("2125", await usdc.decimals())
  );
  const wbtcMintTx = await wbtc.mint(
    await signers[0].getAddress(),
    parseUnits("0.025", await wbtc.decimals())
  );
  const wethDepositTx = await weth.deposit({ value: parseUnits("0.01") });
  await [
    Promise.all([
      msxMintTx.wait(),
      usdcMintTx.wait(),
      wbtcMintTx.wait(),
      wethDepositTx.wait(),
    ]),
  ];

  const Router = await hre.ethers.getContractFactory("Router");
  const router = await Router.deploy(usdc.address);
  await router.deployed();
  const msxApproveTx = await msx.approve(router.address, MaxUint256);
  const usdcApproveTx = await usdc.approve(router.address, MaxUint256);
  const wbtcApproveTx = await wbtc.approve(router.address, MaxUint256);
  const wethApproveTx = await weth.approve(router.address, MaxUint256);
  await Promise.all([
    msxApproveTx.wait(),
    usdcApproveTx.wait(),
    wbtcApproveTx.wait(),
    wethApproveTx.wait(),
  ]);

  const createMsxPoolTx = await router.createYieldFarmablePool(
    msx.address,
    parseUnits("0.003"),
    parseUnits("100", await usdc.decimals()),
    parseUnits("2500", await msx.decimals()),
    "Moonshine Liquidity Token",
    "MSXMSX",
    msx.address
  );
  const createWbtcPoolTx = await router.createYieldFarmablePool(
    wbtc.address,
    parseUnits("0.003"),
    parseUnits("1000", await usdc.decimals()),
    parseUnits(".025", await wbtc.decimals()),
    "Wrapped Bitcoin Liquidity Token",
    "MSXWBTC",
    msx.address
  );
  const createWethPoolTx = await router.createYieldFarmablePool(
    weth.address,
    parseUnits("0.003"),
    parseUnits("25", await usdc.decimals()),
    parseUnits(".01", await weth.decimals()),
    "Wrapped Ether Liquidity Token",
    "MSXWETH",
    msx.address
  );
  await Promise.all([
    await createWethPoolTx.wait(),
    await createMsxPoolTx.wait(),
    await createWbtcPoolTx.wait(),
  ]);
  const msxPool = await router.pools(0);
  const wbtcPool = await router.pools(1);
  console.log(wbtcPool);
  const wethPool = await router.pools(2);

  const FeeSubsidyDrip = await hre.ethers.getContractFactory("FeeSubsidyDrip");
  const feeSubsidyDrip = await FeeSubsidyDrip.deploy(
    weth.address,
    msx.address,
    router.address,
    msxPool,
    wethPool,
    router.address
  );
  await feeSubsidyDrip.deployed();
  tx = await signers[0].sendTransaction({
    to: feeSubsidyDrip.address,
    value: parseUnits(".01"),
    gasLimit: 3000000,
  });
  await tx.wait();
  // tx = await signers[0].sendTransaction({
  //   to: "0xAdfe2B5BeAc83382C047d977db1df977FD9a7e41",
  //   value: parseUnits("1"),
  //   gasLimit: 3000000,
  // });
  // await tx.wait();
  // await hre.run("verify:verify", {
  //   address: router.address,
  //   constructorArguments: [usdc.address],
  // });
  // await hre.run("verify:verify", {
  //   address: feeSubsidyDrip.address,
  //   constructorArguments: [
  //     WETH_ADDRESS,
  //     msx.address,
  //     router.address,
  //     msxPool,
  //     wethPool,
  //     router.address,
  //   ],
  // });
  printDevTokenList({
    msxAddress: msx.address,
    usdcAddress: usdc.address,
    wbtcAddress: wbtc.address,
    wethAddress: weth.address,
  });
  console.log(`export const ROUTER_ADDRESS = "${router.address}"`);
  console.log(`export const BASE_TOKEN_ADDRESS = "${usdc.address}"`);
  console.log(
    `export const FEE_SUBSIDY_DRIP_ADDRESS = "${feeSubsidyDrip.address}"`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function printDevTokenList({
  msxAddress,
  wbtcAddress,
  usdcAddress,
  wethAddress,
}) {
  console.log(
    JSON.stringify([
      {
        symbol: "Ether",
        logoURI: "https://i.ibb.co/0jBv18b/download.png",
        name: "Ether",
        address: wethAddress,
      },
      {
        symbol: "MSX",
        logoURI: "https://i.ibb.co/kg8ZTcM/logo-d5a83f30-1.png",
        name: "Moonshine",
        address: msxAddress,
      },
      {
        symbol: "USDC",
        logoURI:
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
        name: "USD Coin",
        address: usdcAddress,
      },
      {
        symbol: "WBTC",
        logoURI:
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
        name: "Wrapped BTC",
        address: wbtcAddress,
      },
    ])
  );
}
