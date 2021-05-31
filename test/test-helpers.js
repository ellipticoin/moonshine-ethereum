async function setup(balances) {
  for (const address in balances) {
    for ([amount, token] of balances[address]) {
      await token.mint(address, amount);
    }
  }
}

module.exports = {
  setup,
};
