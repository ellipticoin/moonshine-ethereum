//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "./Subsidizer.sol";
import "hardhat/console.sol";

contract Refundable {
    uint256 constant BASE_COST = 22147;
    modifier refundable(Subsidizer subsidizer) {
        uint256 gasLeftBefore = gasleft();
        _;
        subsidizer.refund(payable(tx.origin), (gasLeftBefore - gasleft() + BASE_COST)* tx.gasprice);
    }
}
