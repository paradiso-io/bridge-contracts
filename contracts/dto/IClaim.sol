pragma solidity 0.5.17;

interface IClaim {
	function claimBridgeToken(address _to, uint256 _amount, uint256 _chainId, uint256 _claimId) external;
	function burnForBridge(address _burner, uint256 _amount) external;
}