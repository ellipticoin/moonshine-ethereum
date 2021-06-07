const hre = require("hardhat");
const {
  utils: { parseUnits },
  constants: { MaxUint256 },
} = ethers;

async function main() {
  signers = await ethers.getSigners();
  const MintableERC20 = await hre.ethers.getContractFactory("MintableERC20");
  const usdc = await MintableERC20.deploy("USD Coin", "USDC", 6);
  const msx = await MintableERC20.deploy("Moonshine", "MSX", 6);
  const wbtc = await MintableERC20.deploy("Wrapped Bitcoin", "WBTC", 8);

  await usdc.deployed();
  await msx.deployed();
  await wbtc.deployed();
  console.log("Deployed token contracts");
  printDevTokenList({
    msxAddress: msx.address,
    usdcAddress: usdc.address,
    wbtcAddress: wbtc.address,
  });
  // console.log(`MSX: ${msx.address}`);
  // console.log(`USDC: ${usdc.address}`);
  // console.log(`WBTC: ${wbtc.address}`);
  //
  await msx.mint(
    await signers[0].getAddress(),
    parseUnits("2500", await msx.decimals())
  );
  await usdc.mint(
    await signers[0].getAddress(),
    parseUnits("2100", await usdc.decimals())
  );
  await wbtc.mint(
    await signers[0].getAddress(),
    parseUnits("0.025", await wbtc.decimals())
  );

  const Router = await hre.ethers.getContractFactory("Router");
  const router = await Router.deploy(usdc.address);
  await router.deployed();
  await msx.approve(router.address, MaxUint256);
  await usdc.approve(router.address, MaxUint256);
  await wbtc.approve(router.address, MaxUint256);

  await router.createYieldFarmablePool(
    msx.address,
    parseUnits("0.003"),
    parseUnits("100", await usdc.decimals()),
    parseUnits("2500", await msx.decimals()),
    "Moonshine Liquidity Token",
    "MSXMSX",
    msx.address
  );
  console.log(await router.pools(0));
  await router.createYieldFarmablePool(
    wbtc.address,
    parseUnits("0.003"),
    parseUnits("1000", await usdc.decimals()),
    parseUnits(".025", await wbtc.decimals()),
    "Wrapped Bitcoin Liquidity Token",
    "MSXWBTC",
    msx.address
  );

  console.log("Router deployed to:", router.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function printDevTokenList({ msxAddress, wbtcAddress, usdcAddress }) {
  console.log(
    JSON.stringify([
      {
        symbol: "Ether",
        logoURI: "https://i.ibb.co/0jBv18b/download.png",
        name: "Ether",
        address: "0xD25f374A2d7d40566b006eC21D82b9655865F941",
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
