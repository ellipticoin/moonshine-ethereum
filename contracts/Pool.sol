//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Pool is ERC20 {
    address creator;
    using SafeERC20 for IERC20;
    IERC20 public baseToken;
    IERC20 public token;
    mapping(address => uint256) harvested;
    uint256 public immutable liquidityFee;

    constructor(
        IERC20 _baseToken,
        IERC20 _token,
        uint256 _liquidityFee,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        creator = msg.sender;
        baseToken = _baseToken;
        token = _token;
        liquidityFee = _liquidityFee;
    }

    modifier onlyCreator() {
        require(msg.sender == creator);
        _;
    }

    function safeTransfer(
        IERC20 _token,
        address sender,
        uint256 amount
    ) public onlyCreator {
        _token.safeTransfer(sender, amount);
    }

    function mint(address to, uint256 amount) public virtual onlyCreator {
        _mint(to, amount);
    }

    function burn(address who, uint256 amount) public virtual onlyCreator {
        _burn(who, amount);
    }

    function isFarmable() public pure virtual returns (bool) {
        return false;
    }
}
