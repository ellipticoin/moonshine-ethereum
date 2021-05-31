// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const Router = await hre.ethers.getContractFactory("Router");
  const router = await Router.deploy(
    "0xf47c0c1FF7464601FfFb52FBcB0abCa2bd94Bb5A"
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
