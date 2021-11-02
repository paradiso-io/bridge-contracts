pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

// Inheritance
//import "../interfaces/IStakingRewards.sol";

import "../interfaces/IStakingTokenLock.sol";

// https://docs.synthetix.io/contracts/source/contracts/stakingrewards
contract DTOStakingUpgrade is Initializable, ReentrancyGuardUpgradeable, UUPSUpgradeable,PausableUpgradeable,OwnableUpgradeable{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /* ========== STATE VARIABLES ========== */
    IStakingTokenLock public stakingTokenLock;
    IERC20Upgradeable public rewardsToken;
    IERC20Upgradeable public stakingToken;
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    uint256 public stakingLockTime;

    address public rewardsDistribution;
     function initialize() public initializer {
        __Ownable_init();
    }

   
    function _authorizeUpgrade(address) internal override onlyOwner {}
     uint256 public number ;
  function setNumbetTest (uint256 _number)   external {
      number = _number;
  } 
  function getNumberTest () external view returns (uint256) {
      return number;
  }
    // /* ========== EVENTS ========== */

    // event RewardAdded(uint256 reward);
    // event Staked(address indexed user, uint256 amount);
    // event Withdrawn(address indexed user, uint256 amount);
    // event RewardPaid(address indexed user, uint256 reward);
    // event RewardsDurationUpdated(uint256 newDuration);
    // event Recovered(address token, uint256 amount);
}