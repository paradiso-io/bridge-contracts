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

contract DTOBonding is Governable, ChainIdHolding, IBonding {
    using SafeMath for uint256;

    address public override dtoToken;
    address[] public override validatorList;

    mapping(address => Validator) public validatorMap;
    
    mapping(address => ValidatorPending) public pendingValidators;

    uint256 public immutable override BONDING_AMOUNT;
    uint256 public constant override MINIMUM_WAITING = 1 hours;
    constructor(uint256 _bondingAmount, address _dtoToken) public {
        BONDING_AMOUNT = _bondingAmount;
        dtoToken = _dtoToken;
    }

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
        pendingValidators[msg.sender] = ValidatorPending({
            addr: msg.sender,
            blockNumber: block.number,
            timestamp: block.timestamp
        });
        emit ValidatorApply(msg.sender, block.number, block.timestamp);
    }

    function approveValidator(address _validator) external override onlyGovernance notValidator(_validator) {
        require(pendingValidators[_validator].blockNumber > 0, "DTOBonding: not a pending validator");
        require(pendingValidators[_validator].timestamp.sub(block.timestamp) >= MINIMUM_WAITING, "DTOBonding: approval too early");

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
        delete validatorMap[msg.sender];

        SafeTransferHelper.safeTransfer(dtoToken, msg.sender, BONDING_AMOUNT);

        //delete validator from list
        for(uint256 i = 0;  i < validatorList.length; i++) {
            if (validatorList[i] == msg.sender) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }
    }

    function getValidatorInfo(address addr) external override view returns (address, uint256, uint256) {
        return (validatorMap[addr].addr, validatorMap[addr].blockNumber, validatorMap[addr].timestamp);
    }
    
    function getPendingValidatorInfo(address addr) external override view returns (address, uint256, uint256) {
        return (pendingValidators[addr].addr, validatorMap[addr].blockNumber, validatorMap[addr].timestamp);
    }

    function isValidator(address addr) external override view returns (bool) {
        return validatorMap[addr].blockNumber > 0;
    }
}