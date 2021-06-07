//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./YieldFarmable.sol";
import "./Pool.sol";

contract YieldFarmablePool is YieldFarmable, Pool {
    constructor(
        IERC20 _baseToken,
        IERC20 _token,
        uint256 _liquidityFee,
        string memory name,
        string memory symbol,
        Issuable rewardToken
    )
        YieldFarmable(rewardToken)
        Pool(_baseToken, _token, _liquidityFee, name, symbol)
    {}

    function yieldPerSecond() public view virtual override returns (uint256) {
        return 160000;
    }

    function mint(address to, uint256 amount)
        public
        virtual
        override(Pool, YieldFarmable)
    {
        _mint(to, amount);
    }

    function burn(address who, uint256 amount)
        public
        virtual
        override(Pool, YieldFarmable)
    {
        _burn(who, amount);
    }

    function isFarmable() public pure virtual override returns (bool) {
        return true;
    }
}
