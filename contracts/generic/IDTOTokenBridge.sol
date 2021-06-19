pragma solidity 0.5.17;

interface IDTOTokenBridge {
    function claimBridgeToken(address _originToken, address _to, uint256 _amount, uint256[] calldata _chainIdsIndex, bytes32 _txHash) external;
}
