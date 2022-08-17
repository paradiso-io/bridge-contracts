pragma solidity ^0.8.0;

interface IDTONFT721Bridge {
    function claimBridgeToken(bytes memory _originToken, address _to, uint256 _tokenId, string memory tokenUri) external;
    function updateBaseURI(string memory _newURI ) external;
    function updateTokenURIIfDifferent(uint256 _tokenId, string memory _newURI) external;
}
