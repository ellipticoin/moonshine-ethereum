//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange is ERC20 {
    using SafeERC20 for IERC20;
    uint256 constant FEE = 3 * 10**15;
    IERC20 baseToken;
    IERC20 token;

    constructor(
        IERC20 _baseToken,
        IERC20 _token,
        uint256 initialBaseTokenAmount,
        uint256 initialTokenAmount,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        token = _token;
        baseToken = _baseToken;
        baseToken.safeTransferFrom(
            msg.sender,
            address(this),
            initialBaseTokenAmount
        );
        token.safeTransferFrom(msg.sender, address(this), initialTokenAmount);
        _mint(msg.sender, initialTokenAmount);
    }

    function addLiquidity(uint256 inputAmount) public {
        _mint(
            msg.sender,
            proportionOf(
                inputAmount,
                totalSupply(),
                token.balanceOf(address(this))
            )
        );
        baseToken.safeTransferFrom(
            msg.sender,
            address(this),
            proportionOf(
                inputAmount,
                baseToken.balanceOf(address(this)),
                token.balanceOf(address(this))
            )
        );
        token.safeTransferFrom(msg.sender, address(this), inputAmount);
    }

    function removeLiquidity(uint256 percentageToBurn) public {
        /*         console.log("1"); */
        /*         console.log("%s",balanceOf(msg.sender)); */
        /*         console.log("%s", */
        /*                 proportionOf( */
        /*                     balanceOf(msg.sender), */
        /*                     percentageToBurn, */
        /*                     1 ether */
        /*                 ) */
        /* ); */
        /*         console.log("%s", */
        /*             proportionOf( */
        /*                 baseToken.balanceOf(address(this)), */
        /*                 proportionOf( */
        /*                     balanceOf(msg.sender), */
        /*                     percentageToBurn, */
        /*                     1 ether */
        /*                 ), */
        /*                 totalSupply() */
        /*             ) */
        /* ); */
        baseToken.safeTransfer(
            msg.sender,
            proportionOf(
                baseToken.balanceOf(address(this)),
                proportionOf(balanceOf(msg.sender), percentageToBurn, 1 ether),
                totalSupply()
            )
        );
        /* console.log("2"); */
        token.safeTransfer(
            msg.sender,
            proportionOf(
                token.balanceOf(address(this)),
                proportionOf(balanceOf(msg.sender), percentageToBurn, 1 ether),
                totalSupply()
            )
        );
        /* console.log("3"); */
        _burn(
            msg.sender,
            proportionOf(totalSupply(), percentageToBurn, 1 ether)
        );
    }

    function buy(uint256 inputAmount) public {
        token.safeTransfer(
            msg.sender,
            calculateOutputAmount(
                baseToken.balanceOf(address(this)),
                token.balanceOf(address(this)),
                inputAmount - getFee(inputAmount)
            )
        );
        baseToken.safeTransferFrom(msg.sender, address(this), inputAmount);
    }

    function sell(uint256 inputAmount) public {
        baseToken.safeTransfer(
            msg.sender,
            calculateOutputAmount(
                token.balanceOf(address(this)),
                baseToken.balanceOf(address(this)),
                inputAmount - getFee(inputAmount)
            )
        );
        token.safeTransferFrom(msg.sender, address(this), inputAmount);
    }

    function calculateOutputAmount(
        uint256 inputSupply,
        uint256 outputSupply,
        uint256 inputAmount
    ) internal pure returns (uint256) {
        uint256 newInputSupply = inputSupply + inputAmount;
        uint256 invariant = inputSupply * outputSupply;
        uint256 newOutputSupply = invariant / newInputSupply;
        return outputSupply - newOutputSupply;
    }

    function proportionOf(
        uint256 value,
        uint256 x,
        uint256 y
    ) internal pure returns (uint256) {
        return ((value * x) / y);
    }

    function getFee(uint256 amount) internal pure returns (uint256) {
        uint256 fee = (amount * FEE) / 1 ether;
        return fee == 0 ? 1 : fee;
    }
}
