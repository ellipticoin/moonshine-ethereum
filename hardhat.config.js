require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
const ethers = require("ethers")
const {utils: {arrayify}} = ethers

const {
    ALCHEMY_API_KEY,
    ROPSTEN_PRIVATE_KEY,
    MAINNET_PRIVATE_KEY,
} = process.env
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // networks: {
  //   ropsten: {
  //     url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
  //     accounts: [arrayify(ROPSTEN_PRIVATE_KEY)]
  //   }
  // },
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [ROPSTEN_PRIVATE_KEY]
    }
  },
  etherscan: {
    url: "https://api-kovan.etherscan.io/api",
    apiKey: "5GX8KUJB3RBPNIMT6VPY44T3NYJXWJIEHT",
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  }
};
