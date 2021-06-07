//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MintableByIssuers.sol";
import "./Issuable.sol";

abstract contract YieldFarmable is ERC20 {
    uint256 public constant PRECISION = 1e12;
    Issuable public rewardToken;
    uint256 public totalYieldPerToken;
    uint256 public lastCheckpoint;
    mapping(address => uint256) public yieldHarvested;

    constructor(Issuable _rewardToken) {
        lastCheckpoint = block.timestamp;
        rewardToken = _rewardToken;
    }

    function yieldPerSecond() public view virtual returns (uint256);

    function saveCheckpoint() public {
        if (totalSupply() > 0) {
            totalYieldPerToken += (((yieldPerSecond() *
                secondsSinceLastCheckpoint()) * PRECISION) / totalSupply());
            lastCheckpoint = block.timestamp;
        }
    }

    function mint(address account, uint256 amount) public virtual {
        saveCheckpoint();
        _mint(account, amount);
    }

    function burn(address who, uint256 amount) public virtual {
        saveCheckpoint();
        _burn(who, amount);
    }

    function harvest() public {
        saveCheckpoint();
        uint256 pendingYield = getPendingYield(msg.sender);
        rewardToken.mint(msg.sender, pendingYield);
        yieldHarvested[msg.sender] += pendingYield;
        lastCheckpoint = block.timestamp;
    }

    function getPendingYield(address owner) public view returns (uint256) {
        if (totalSupply() == 0) {
            return 0;
        } else {
            return
                ((balanceOf(owner) * totalYieldPerToken) / PRECISION) +
                ((balanceOf(owner) *
                    secondsSinceLastCheckpoint() *
                    yieldPerSecond()) / totalSupply()) -
                yieldHarvested[owner];
        }
    }

    function secondsSinceLastCheckpoint() public view returns (uint256) {
        return block.timestamp - lastCheckpoint;
    }
}
