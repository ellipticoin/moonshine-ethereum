//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface Issuable is IERC20 {
    function mint(address to, uint256 amount) external;

    function burn(address who, uint256 amount) external;
}
