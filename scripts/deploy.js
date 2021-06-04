// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const Router = await hre.ethers.getContractFactory("Router");
  const router = await Router.deploy(
    "0xFD288C066439DE9185f37116F414eaBD8E6d6858"
  );

  await router.deployed();

  console.log("Router deployed to:", router.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
