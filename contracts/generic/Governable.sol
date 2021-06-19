pragma solidity 0.5.17;
import "@openzeppelin/contracts/ownership/Ownable.sol";

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