pragma solidity ^0.8.0;

interface IDTONFT1155Bridge {
    function claimBridgeToken(address _originToken, address _to, uint256 _id, uint256 _amount, uint256[] memory _chainIdsIndex, bytes32 _txHash, bytes memory _data) external;
}
