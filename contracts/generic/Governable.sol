pragma solidity ^0.7.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Governable is Ownable {
	modifier onlyGovernance() {
		require(msg.sender == owner(), "!onlyGovernance");
		_;
	}

	address public governance;

	function setGovernance(address _gov) public onlyGovernance {
		governance = _gov;
	}
}