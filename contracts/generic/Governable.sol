pragma solidity ^0.7.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Governable is Ownable {
	modifier onlyGovernance() {
		require(msg.sender == owner(), "!onlyGovernance");
		_;
	}
}