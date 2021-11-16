pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol"; // for WETH
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../generic/Governable.sol";
import "../lib/ChainIdHolding.sol";
import "../lib/SafeTransferHelper.sol";
import "../interfaces/IBonding.sol";
import "./LockingTokenValidator.sol";

contract DTOBondingUpgradeable is Initializable, Governable, ChainIdHolding, IBonding, UUPSUpgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public override dtoToken;
    address[] public override validatorList;
    mapping(address => Validator) public validatorMap;
    mapping(address => ValidatorPending) public pendingValidators;
    uint256 public override BONDING_AMOUNT;
    uint256 public override MINIMUM_WAITING;
    uint256 public APPROVE_PERCENT_THRESHOLD;
    uint256 public MAX_LOCKING_TOKEN;
    uint256 public POOL_LOCKED_TIME;
    LockingTokenValidator public lockingtoken;

    function _authorizeUpgrade(address) internal override onlyOwner {}
    
    modifier notValidator(address addr) {
        require(validatorMap[addr].blockNumber == 0, "DTOBonding: Already a validator");
        _;
    }

    modifier notPendingValidator(address addr) {
        require(pendingValidators[addr].blockNumber == 0, "DTOBonding: Already a pending validator");
        _;
    }

    function applyValidtor() external override notValidator(msg.sender) notPendingValidator(msg.sender) {
        SafeTransferHelper.safeTransferFrom(dtoToken, msg.sender, address(this), BONDING_AMOUNT);
        address[] memory approveList;
        pendingValidators[msg.sender] = ValidatorPending({
            addr: msg.sender,
            blockNumber: block.number,
            timestamp: block.timestamp,
            approveList: approveList
        });
        emit ValidatorApply(msg.sender, block.number, block.timestamp);
    }

    function approveValidator(address _validator) external override notValidator(_validator) {
        require(validatorMap[msg.sender].blockNumber > 0, "DTOBonding: not a validator to approve");
        require(pendingValidators[_validator].blockNumber > 0, "DTOBonding: not a pending validator");
        require(block.timestamp.sub(pendingValidators[_validator].timestamp) >= MINIMUM_WAITING, "DTOBonding: approval too early");

        address[] memory approvedList = pendingValidators[_validator].approveList;
        bool found = false;
        for(uint i = 0; i < approvedList.length; i++) {
            if (approvedList[i] == msg.sender) {
                found = true;
                break;
            }
        }
        if (!found) {
            pendingValidators[_validator].approveList.push(msg.sender);
        }
    }

    function foundationApproveValidator(address _validator) external onlyGovernance notValidator(_validator) {
        require(pendingValidators[_validator].blockNumber > 0, "DTOBonding: not a pending validator");
        if (validatorList.length != 0) {
        require(pendingValidators[_validator].approveList.length.mul(100).div(validatorList.length) >= APPROVE_PERCENT_THRESHOLD, "DTOBonding: not enough approvals from validators");
        }
        require(block.timestamp.sub(pendingValidators[_validator].timestamp) >= MINIMUM_WAITING, "DTOBonding: approval too early");

        validatorMap[_validator] = Validator({
            addr: _validator,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        validatorList.push(_validator);

        delete pendingValidators[_validator];
    }

    //todo:lock validator amount
    function resignValidator() external override {
        require(validatorMap[msg.sender].blockNumber > 0, "DTOBonding: not a validator");
        IERC20Upgradeable(dtoToken).approve(address(lockingtoken), MAX_LOCKING_TOKEN);
        lock(dtoToken, msg.sender, BONDING_AMOUNT, POOL_LOCKED_TIME);
    }

    function cancelValidatorApplication() external {
        require(pendingValidators[msg.sender].blockNumber > 0, "DTOBonding: not a pending validator");
        delete pendingValidators[msg.sender];

        SafeTransferHelper.safeTransfer(dtoToken, msg.sender, BONDING_AMOUNT);
    }

    function getValidatorInfo(address addr) external override view returns (address, uint256, uint256) {
        return (validatorMap[addr].addr, validatorMap[addr].blockNumber, validatorMap[addr].timestamp);
    }
    
    function getPendingValidatorInfo(address addr) external override view returns (address, uint256, uint256) {
        return (pendingValidators[addr].addr, pendingValidators[addr].blockNumber, pendingValidators[addr].timestamp);
    }

    function isValidator(address addr) external override view returns (bool) {
        return validatorMap[addr].blockNumber > 0;
    }

    function lock(address _token, address _addr, uint256 _amount, uint256 _lockedTime) public {
        lockingtoken.lock(_token, _addr, _amount, _lockedTime);
    }

    function unlock(address _addr, uint256 index) public {
            lockingtoken.unlock(_addr, index);
        }

    function getLockInfo(address _user) external view returns (
            bool[] memory isWithdrawns,
            address[] memory tokens,
            uint256[] memory unlockableAts,
            uint256[] memory amounts
        )
    {
        return lockingtoken.getLockInfo(_user);
    }

    function getLockInfoByIndexes(address _addr, uint256[] memory _indexes) external view returns (
            bool[] memory isWithdrawns,
            address[] memory tokens,
            uint256[] memory unlockableAts,
            uint256[] memory amounts
        )
    {
        return lockingtoken.getLockInfoByIndexes(_addr, _indexes);
    }

    function getLockInfoLength(address _addr) external view returns (uint256) {
        return lockingtoken.getLockInfoLength(_addr);
    } 

    function setMaxLockingToken (uint256 _maxlockingtoken)   external {
        MAX_LOCKING_TOKEN = _maxlockingtoken;
    } 
    function getMaxLockingToken () external view returns (uint256) {
        return MAX_LOCKING_TOKEN;
    }    
}