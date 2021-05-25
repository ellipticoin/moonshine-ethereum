//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Exchange.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router {
    IERC20 baseToken;
    constructor(
        IERC20 _baseToken
    ) {
        baseToken = _baseToken;
    }
    function createExchange(
        IERC20 token,
        uint256 initialBaseTokenAmount,
        uint256 initialTokenAmount,
        string memory name,
        string memory symbol
    ) public {
        new Exchange(
        baseToken,
        token,
        initialBaseTokenAmount,
        initialTokenAmount,
        name,
        symbol
);
    }
}
