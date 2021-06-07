//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Issuable.sol";

contract MintableByIssuers is ERC20, AccessControl, Issuable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ISSUER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount)
        public
        virtual
        override
        onlyRole(ISSUER_ROLE)
    {
        _mint(to, amount);
    }

    function burn(address who, uint256 amount)
        public
        virtual
        override
        onlyRole(ISSUER_ROLE)
    {
        _burn(who, amount);
    }
}
