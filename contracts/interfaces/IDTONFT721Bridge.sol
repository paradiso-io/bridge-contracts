pragma solidity ^0.8.0;

interface IDTONFT721Bridge {
    function claimBridgeToken(bytes memory _originToken, address _to, uint256 _tokenId, uint256[] memory _chainIdsIndex, bytes32 _txHash) external;
    function updateBaseURI(string memory _newURI ) external;
}
