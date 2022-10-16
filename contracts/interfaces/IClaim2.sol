pragma solidity ^0.8.0;

interface IClaim2 {
    function claimToken(
        address _originToken,
        address _toAddr,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external;
}
