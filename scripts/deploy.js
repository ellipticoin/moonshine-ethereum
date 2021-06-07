const hre = require("hardhat");

async function main() {
  const MintableByIssuers = await hre.ethers.getContractFactory(
    "MintableByIssuers"
  );
  const Router = await hre.ethers.getContractFactory("Router");
  const router = await Router.deploy(
    "0xFD288C066439DE9185f37116F414eaBD8E6d6858"
  );

  await router.deployed();
  const moonshine = await MintableByIssuers.deploy("Moonshine", "MSX");

  await router.createPool(
    moonshine.address,
    parseUnits("0.003"),
    parseUnits("2500"),
    parseUnits("100"),
    "Moonshine Liquidity Token",
    "MSXMSX"
  );
  const moonshinePool = (await ethers.getContractFactory("Pool")).attach(
    await router.pools(0)
  );

  await rewardToken.grantRole(
    await rewardToken.ISSUER_ROLE(),
    moonshinePool.address
  );

  console.log("Router deployed to:", router.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
