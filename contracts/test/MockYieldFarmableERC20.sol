//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../YieldFarmable.sol";
import "../Issuable.sol";

contract MockYieldFarmableERC20 is YieldFarmable {
    constructor(
        string memory name,
        string memory symbol,
        Issuable _rewardToken
    ) YieldFarmable(_rewardToken) ERC20(name, symbol) {}

    function yieldPerSecond() public view virtual override returns (uint256) {
        return 1 ether;
    }
}
