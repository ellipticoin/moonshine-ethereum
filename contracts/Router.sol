//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router {
    using SafeERC20 for IERC20;
    IERC20 baseToken;
    Pool[] public pools;

    constructor(IERC20 _baseToken) {
        baseToken = _baseToken;
    }

    function convert(
        Pool inputPool,
        Pool outputPool,
        uint256 inputAmount
    ) public {
        uint256 outputAmount = calculateOutputAmount(
            inputPool.token().balanceOf(address(inputPool)),
            baseToken.balanceOf(address(inputPool)),
            inputAmount - getFee(inputPool, inputAmount)
        );
        inputPool.token().safeTransferFrom(msg.sender, address(this), inputAmount);
        outputPool.safeTransfer(
            outputPool.token(),
            msg.sender,
            calculateOutputAmount(
                baseToken.balanceOf(address(outputPool)),
                outputPool.token().balanceOf(address(outputPool)),
                outputAmount - getFee(outputPool, outputAmount)
            )
        );
        inputPool.safeTransfer(baseToken, address(outputPool), outputAmount);
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
        require(pool.token().balanceOf(address(this)) == 0);
        token.approve(address(pool), type(uint256).max);
        baseToken.approve(address(pool), type(uint256).max);
        baseToken.safeTransferFrom(
            msg.sender,
            address(this),
            initialBaseTokenAmount
        );
        baseToken.safeTransfer(address(pool), initialBaseTokenAmount);
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
        baseToken.safeTransferFrom(
            msg.sender,
            address(this),
            proportionOf(
                inputAmount,
                baseToken.balanceOf(address(pool)),
                pool.token().balanceOf(address(pool))
            )
        );
        baseToken.safeTransfer(
            address(pool),
            proportionOf(
                inputAmount,
                baseToken.balanceOf(address(pool)),
                pool.token().balanceOf(address(pool))
            )
        );
        pool.token().safeTransferFrom(msg.sender, address(pool), inputAmount);
    }

    function removeLiquidity(Pool pool, uint256 percentageToBurn) public {
        pool.safeTransfer(
            baseToken,
            msg.sender,
            proportionOf(
                baseToken.balanceOf(address(pool)),
                proportionOf(
                    pool.balanceOf(msg.sender),
                    percentageToBurn,
                    1 ether
                ),
                pool.totalSupply()
            )
        );
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
                baseToken.balanceOf(address(pool)),
                pool.token().balanceOf(address(pool)),
                inputAmount - getFee(pool, inputAmount)
            )
        );
        baseToken.safeTransferFrom(msg.sender, address(pool), inputAmount);
    }

    function sell(Pool pool, uint256 inputAmount)
        public {
        pool.safeTransfer(baseToken, msg.sender, 
calculateOutputAmount(
            pool.token().balanceOf(address(pool)),
            baseToken.balanceOf(address(pool)),
            inputAmount - getFee(pool, inputAmount)
        )
);
        pool.token().safeTransferFrom(msg.sender, address(this), inputAmount);
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

    function getFee(Pool pool, uint256 amount) internal view returns (uint256) {
        uint256 fee = (amount * pool.liquidityFee()) / 1 ether;
        return fee == 0 ? 1 : fee;
    }
}
