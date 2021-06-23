//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Pool.sol";
import "./YieldFarmablePool.sol";
import "./Issuable.sol";
import "./Subsidizer.sol";
import "./Refundable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router is Refundable {
    using SafeERC20 for IERC20;
    IERC20 public baseToken;
    bool public called;
    Pool[] public pools;
    mapping(Pool => uint112) public baseTokenBalances;
    mapping(Pool => uint256) public tokenBalances;

    constructor(IERC20 _baseToken) {
        baseToken = _baseToken;
    }

    function setCalled() public {
        called = true;
    }

    function callWithSubsity(Subsidizer subsidizer)
        public
        refundable(subsidizer)
    {}

    function currentBlockTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function convertWithSubsity(
        Pool inputPool,
        Pool outputPool,
        uint256 inputAmount,
        Subsidizer subsidizer
    ) public refundable(subsidizer) {
        convert(inputPool, outputPool, inputAmount);
    }

    function convert(
        Pool inputPool,
        Pool outputPool,
        uint256 inputAmount
    ) public {
        uint256 baseTokenAmount =
            calculateOutputAmount(
                inputPool,
                tokenBalances[inputPool],
                baseTokenBalances[inputPool],
                inputAmount
            );
        chargeToken(inputPool, inputAmount);
        payToken(
            outputPool,
            calculateOutputAmount(
                outputPool,
                baseTokenBalances[outputPool],
                tokenBalances[outputPool],
                baseTokenAmount
            )
        );
        transferBaseToken(inputPool, outputPool, baseTokenAmount);
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
        chargeBaseToken(pool, initialBaseTokenAmount);
        chargeToken(pool, initialTokenAmount);
        pool.mint(msg.sender, initialTokenAmount);
        pools.push(pool);
    }

    function createYieldFarmablePool(
        IERC20 token,
        uint256 liquidityFee,
        uint256 initialBaseTokenAmount,
        uint256 initialTokenAmount,
        string memory name,
        string memory symbol,
        Issuable rewardToken
    ) public {
        YieldFarmablePool pool =
            new YieldFarmablePool(
                baseToken,
                token,
                liquidityFee,
                name,
                symbol,
                rewardToken
            );
        chargeBaseToken(pool, initialBaseTokenAmount);
        chargeToken(pool, initialTokenAmount);
        pool.mint(msg.sender, initialTokenAmount);
        pools.push(pool);
    }

    function addLiquidity(Pool pool, uint256 inputAmount) public {
        pool.mint(
            msg.sender,
            proportionOf(inputAmount, pool.totalSupply(), tokenBalances[pool])
        );
        chargeBaseToken(
            pool,
            proportionOf(
                inputAmount,
                baseTokenBalances[pool],
                tokenBalances[pool]
            )
        );
        chargeToken(pool, inputAmount);
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
        payBaseToken(pool, baseTokenToRemove);
        uint256 tokenToRemove =
            proportionOf(
                tokenBalances[pool],
                proportionOf(
                    pool.balanceOf(msg.sender),
                    percentageToBurn,
                    1 ether
                ),
                pool.totalSupply()
            );
        payToken(pool, tokenToRemove);
        pool.burn(
            msg.sender,
            proportionOf(pool.balanceOf(msg.sender), percentageToBurn, 1 ether)
        );
    }

    function buy(Pool pool, uint256 inputAmount) public {
        payToken(
            pool,
            calculateOutputAmount(
                pool,
                baseTokenBalances[pool],
                tokenBalances[pool],
                inputAmount
            )
        );
        chargeBaseToken(pool, inputAmount);
    }

    function buyWithSubsity(
        Pool pool,
        uint256 inputAmount,
        Subsidizer subsidizer
    ) public refundable(subsidizer) {
        buy(pool, inputAmount);
    }

    function payToken(Pool pool, uint256 amount) public {
        pool.token().safeTransfer(msg.sender, amount);
        tokenBalances[pool] -= amount;
    }

    function chargeToken(Pool pool, uint256 amount) public {
        pool.token().safeTransferFrom(msg.sender, address(this), amount);
        tokenBalances[pool] += amount;
    }

    function transferBaseToken(
        Pool inputPool,
        Pool outputPool,
        uint256 amount
    ) public {
        baseTokenBalances[inputPool] -= uint112(amount);
        baseTokenBalances[outputPool] += uint112(amount);
    }

    function payBaseToken(Pool pool, uint256 amount) public {
        baseTokenBalances[pool] -= uint112(amount);
        baseToken.safeTransfer(msg.sender, amount);
    }

    function chargeBaseToken(Pool pool, uint256 amount) public {
        baseToken.safeTransferFrom(msg.sender, address(this), amount);
        baseTokenBalances[pool] += uint112(amount);
    }

    function sellWithSubsity(
        Pool pool,
        uint256 inputAmount,
        Subsidizer subsidizer
    ) public refundable(subsidizer) {
        sell(pool, inputAmount);
    }

    function sell(Pool pool, uint256 inputAmount) public {
        baseToken.safeTransfer(
            msg.sender,
            calculateOutputAmount(
                pool,
                tokenBalances[pool],
                baseTokenBalances[pool],
                inputAmount
            )
        );
        baseTokenBalances[pool] += uint112(inputAmount);
        pool.token().safeTransferFrom(msg.sender, address(this), inputAmount);
        tokenBalances[pool] -= inputAmount;
    }

    function calculateOutputAmount(
        Pool pool,
        uint256 inputSupply,
        uint256 outputSupply,
        uint256 inputAmount
    ) internal view returns (uint256) {
        return
            outputSupply -
            (inputSupply * outputSupply) /
            (inputSupply +
                (inputAmount - (inputAmount * pool.liquidityFee()) / 1 ether));
    }

    function proportionOf(
        uint256 value,
        uint256 x,
        uint256 y
    ) internal pure returns (uint256) {
        return ((value * x) / y);
    }

    function getPoolsLength() public view returns (uint256) {
        return pools.length;
    }
}
