//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router {
    using SafeERC20 for IERC20;
    IERC20 baseToken;
    Pool[] public pools;
    mapping(Pool => uint112) public baseTokenBalances;

    constructor(IERC20 _baseToken) {
        baseToken = _baseToken;
    }

    function convert(
        Pool inputPool,
        Pool outputPool,
        uint256 inputAmount
    ) public {
        uint256 outputAmount =
            calculateOutputAmount(
                inputPool.token().balanceOf(address(inputPool)),
                baseTokenBalances[inputPool],
                inputAmount - getFee(inputPool, inputAmount)
            );
        inputPool.token().safeTransferFrom(
            msg.sender,
            address(this),
            inputAmount
        );
        outputPool.safeTransfer(
            outputPool.token(),
            msg.sender,
            calculateOutputAmount(
                baseTokenBalances[outputPool],
                outputPool.token().balanceOf(address(outputPool)),
                outputAmount - getFee(outputPool, outputAmount)
            )
        );
        baseTokenBalances[inputPool] -= uint112(outputAmount);
        baseTokenBalances[outputPool] += uint112(outputAmount);
    }

    function createPool(
        IERC20 token,
        uint256 liquidityFee,
        uint256 initialBaseTokenAmount,
        uint256 initialTokenAmount,
        string memory name,
        string memory symbol
    ) public {
        Pool pool = new Pool(baseToken, token, liquidityFee, name, symbol);
        baseToken.approve(address(pool), type(uint256).max);
        baseToken.safeTransferFrom(
            msg.sender,
            address(this),
            initialBaseTokenAmount
        );
        baseTokenBalances[pool] += uint112(initialBaseTokenAmount);
        pool.token().safeTransferFrom(
            msg.sender,
            address(this),
            initialTokenAmount
        );
        pool.token().safeTransfer(address(pool), initialTokenAmount);
        pool.mint(msg.sender, initialTokenAmount);
        pools.push(pool);
    }

    function addLiquidity(Pool pool, uint256 inputAmount) public {
        pool.mint(
            msg.sender,
            proportionOf(
                inputAmount,
                pool.totalSupply(),
                pool.token().balanceOf(address(pool))
            )
        );
        uint256 baseTokenToAdd =
            proportionOf(
                inputAmount,
                baseTokenBalances[pool],
                pool.token().balanceOf(address(pool))
            );
        baseTokenBalances[pool] += uint112(baseTokenToAdd);
        baseToken.safeTransferFrom(
            msg.sender,
            address(this),
            baseTokenToAdd
        );
        pool.token().safeTransferFrom(msg.sender, address(pool), inputAmount);
    }

    function removeLiquidity(Pool pool, uint256 percentageToBurn) public {
        uint256 baseTokenToRemove =
            proportionOf(
                baseTokenBalances[pool],
                proportionOf(
                    pool.balanceOf(msg.sender),
                    percentageToBurn,
                    1 ether
                ),
                pool.totalSupply()
            );
        baseTokenBalances[pool] -= uint112(baseTokenToRemove);
        baseToken.safeTransfer(msg.sender, baseTokenToRemove);
        pool.safeTransfer(
            pool.token(),
            msg.sender,
            proportionOf(
                pool.token().balanceOf(address(pool)),
                proportionOf(
                    pool.balanceOf(msg.sender),
                    percentageToBurn,
                    1 ether
                ),
                pool.totalSupply()
            )
        );
        pool.burn(
            msg.sender,
            proportionOf(pool.balanceOf(msg.sender), percentageToBurn, 1 ether)
        );
    }

    function buy(Pool pool, uint256 inputAmount) public {
        pool.safeTransfer(
            pool.token(),
            msg.sender,
            calculateOutputAmount(
                baseTokenBalances[pool],
                pool.token().balanceOf(address(pool)),
                inputAmount - getFee(pool, inputAmount)
            )
        );
        baseToken.safeTransferFrom(msg.sender, address(this), inputAmount);
        baseTokenBalances[pool] += uint112(inputAmount);
    }

    function sell(Pool pool, uint256 inputAmount) public {
        baseToken.safeTransfer(
            msg.sender,
            calculateOutputAmount(
                pool.token().balanceOf(address(pool)),
                baseTokenBalances[pool],
                inputAmount - getFee(pool, inputAmount)
            )
        );
        baseTokenBalances[pool] += uint112(inputAmount);
        pool.token().safeTransferFrom(msg.sender, address(this), inputAmount);
    }

    function calculateOutputAmount(
        uint256 inputSupply,
        uint256 outputSupply,
        uint256 inputAmount
    ) internal pure returns (uint256) {
        return
            outputSupply -
            (inputSupply * outputSupply) /
            (inputSupply + inputAmount);
    }

    function proportionOf(
        uint256 value,
        uint256 x,
        uint256 y
    ) internal pure returns (uint256) {
        return ((value * x) / y);
    }

    function getFee(Pool pool, uint256 amount) internal view returns (uint256) {
        uint256 fee = (amount * pool.liquidityFee()) / 1 ether;
        return fee == 0 ? 1 : fee;
    }
}
