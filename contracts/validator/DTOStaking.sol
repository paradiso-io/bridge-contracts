pragma solidity ^0.7.0;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol"; // for WETH
import "@openzeppelin/contracts/access/Ownable.sol";
import "../generic/Governable.sol";
import "../lib/ChainIdHolding.sol";
import "../lib/SafeTransferHelper.sol";
import "./IBonding.sol";

contract DTOStaking is Governable, ChainIdHolding {
    using SafeMath for uint256;
    address public dtoToken;
    IBonding public bonding;

    uint256 public constant MIN_STAKE = 10e18;  //10 DTO
    uint256 public constant UNSTAKE_WAITING_TIME = 2 days;

    struct UnstakeInfo {
        bool isWithdrawn;
        address validator;
        uint256 withdrawnableTime;
        uint256 amount;
    }

    //user => validator => stake amount
    mapping(address => mapping(address => uint256)) public userInfo;
    mapping(address => uint256) public validatorTotalStake;
    mapping(address => UnstakeInfo[]) public unstakes;

    event Stake(address indexed user, address validator, uint256 amount);
    event Unstake(address indexed user, address validator, uint256 amount);
    event Withdraw(address indexed user, address validator, uint256 amount);
    constructor(address _bonding) public {
        bonding = IBonding(_bonding);
        dtoToken = bonding.dtoToken();
    }

    function stakeDTO(address _validator, uint256 _amount) external {
        require(bonding.isValidator(_validator), "DTOStaking: not a validator");
        SafeTransferHelper.safeTransferFrom(dtoToken, msg.sender, address(this), _amount);
        userInfo[msg.sender][_validator] = userInfo[msg.sender][_validator].add(_amount);
        validatorTotalStake[_validator] = validatorTotalStake[_validator].add(_amount);
        emit Stake(msg.sender, _validator, _amount);
    }

    function unstakeDTO(address _validator, uint256 _amount) external {
        require(userInfo[msg.sender][_validator] >= _amount, "DTOStaking: Withdraw amount exceeds staked");
        userInfo[msg.sender][_validator] = userInfo[msg.sender][_validator].sub(_amount);
        validatorTotalStake[_validator] = validatorTotalStake[_validator].sub(_amount);
        unstakes[msg.sender].push(UnstakeInfo({
            isWithdrawn: false,
            validator: _validator,
            withdrawnableTime: block.timestamp.add(UNSTAKE_WAITING_TIME),
            amount: _amount
        }));
        emit Unstake(msg.sender, _validator, _amount);
    }

    function withdrawUnstake(address _user, uint256 _index) external {
        require(isWithdrawnable(_user, _index), "DTOStaking: time lock or already withdraw");
        unstakes[_user][_index].isWithdrawn = true;
        SafeTransferHelper.safeTransfer(dtoToken, _user, unstakes[_user][_index].amount);

        emit Withdraw(_user, unstakes[_user][_index].validator, unstakes[_user][_index].amount);
    }

    function isWithdrawnable(address _user, uint256 _index) public view returns (bool) {
        return !unstakes[_user][_index].isWithdrawn && block.timestamp >= unstakes[_user][_index].withdrawnableTime;
    }
}