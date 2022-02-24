pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Governable is Initializable, OwnableUpgradeable {
    function __Governable_initialize() internal initializer {
        __Ownable_init();
    }

    modifier onlyGovernance() {
        require(msg.sender == owner(), "!onlyGovernance");
        _;
    }

    address public governance;

    function setGovernance(address _gov) public onlyGovernance {
        governance = _gov;
    }
}
