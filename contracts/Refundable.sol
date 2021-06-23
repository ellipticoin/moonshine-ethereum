//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "./Subsidizer.sol";
import "hardhat/console.sol";

contract Refundable {
    uint256 constant BASE_COST = 37134 - 14907;
    modifier refundable(Subsidizer subsidizer) {
        uint256 gasLeftBefore = gasleft();
        _;
        subsidizer.refund(
            (gasLeftBefore - gasleft() + BASE_COST) * tx.gasprice
        );
    }
}
