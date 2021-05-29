pragma solidity ^0.7.0;

interface IDTOTokenBridge {
	function claimBridgeToken(address _originToken, address _to, uint256 _amount, uint256 _chainId, bytes32 _claimData) external;
}
