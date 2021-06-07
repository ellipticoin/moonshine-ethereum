//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Router.sol";
import "./Issuable.sol";
import "./WETH9.sol";
import "./Refundable.sol";

contract Drip is Ownable {
    Router public router;
    Issuable public dripToken;
    Pool public dripTokenPool;
    Pool public wethPool;
    WETH9 public weth;
    address subsidizedContract;

    uint256 public lastDrip;
    uint256 public dripPerSecond = 1 ether;
    uint256 maxRefund = 0 gwei;

    constructor(
        WETH9 _weth,
        Issuable _dripToken,
        Router _router,
        Pool _dripTokenPool,
        Pool _wethPool,
        address _subsidizedContract
    ) {
        weth = _weth;
        router = _router;
        dripToken = _dripToken;
        dripTokenPool = _dripTokenPool;
        wethPool = _wethPool;
        _dripToken.approve(address(router), type(uint256).max);
        lastDrip = block.timestamp;
        subsidizedContract = _subsidizedContract;
    }

    function drip() public {
        uint256 dripAmount = dripPerSecond * secondsSinceLastDrip();
        dripToken.mint(address(this), dripAmount);
        router.convert(dripTokenPool, wethPool, dripAmount);
        weth.withdraw(weth.balanceOf(address(this)));
        lastDrip = block.timestamp;
    }

    function secondsSinceLastDrip() public view returns (uint256) {
        return block.timestamp - lastDrip;
    }

    function refund(address payable to, uint256 amount) public {
        require(msg.sender == subsidizedContract);
        if (amount >= maxRefund) { 
            to.transfer(maxRefund);
        } else {
            to.transfer(amount);
        }
    }

    function setMaxRefund(uint256 _maxRefund) public onlyOwner {
        maxRefund = _maxRefund;
    }

    function setDripPerSecond(uint256 _dripPerSecond) public onlyOwner {
        dripPerSecond = _dripPerSecond;
    }


    receive() external payable {}

    fallback() external payable {}
}
