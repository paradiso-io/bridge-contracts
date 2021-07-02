pragma solidity ^0.7.0;
interface IBonding {
    function dtoToken() external view returns (address);
    function validatorList(uint256 i) external view returns (address);

    struct Validator {
        address addr;
        uint256 blockNumber;
        uint256 timestamp;
    }

    struct ValidatorPending {
        address addr;
        uint256 blockNumber;
        uint256 timestamp;
        address[] approveList;
    }

    event ValidatorApply(address indexed validator, uint256 blockNumber, uint256 timestamp);
    event ValidatorApproval(address indexed validator, uint256 blockNumber, uint256 timestamp);
    event ValidatorResign(address indexed validator, uint256 blockNumber, uint256 timestamp);

    function isValidator(address addr) external view returns (bool);
    function getValidatorInfo(address addr) external view returns (address, uint256, uint256);
    
    function getPendingValidatorInfo(address addr) external view returns (address, uint256, uint256);

    function BONDING_AMOUNT() external view returns (uint256);
    function MINIMUM_WAITING() external view returns (uint256);

    function applyValidtor() external;

    function approveValidator(address _validator) external;

    //todo:lock validator amount
    function resignValidator() external;
}