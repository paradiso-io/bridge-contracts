// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// mock class using ERC20
contract Test {
    function verifySignatures() public returns (address[2] memory signers) {
        bytes32[] memory r = new bytes32[](2);
        r[0]= 0x437df95b1704894db1e05f6847b585dae781fd68bab819ee4460265375d0fc0b;
        r[1]= 0xed4657f494c78ae95eaadf13765874bd2a9b7f53822234a3cc6a1bab150fe5f0;
        bytes32[] memory s = new bytes32[](2);
        s[0]= 0x342e4209024ac0d39d14799773e817978e68a348bf0811eef8f2ae6f1bc6e0e2;
        s[1]= 0x38be7f44d7e2a9eb75731a20fcf05bec843d05b75dd280026ef128d6341ca384;
        uint8[] memory v = new uint8[](2);
        v[0]= 0x1b;
        v[1]= 0x1c;
        uint256[] memory _chainIdsIndex = new uint256[](4);
        _chainIdsIndex[0]= 97;
        _chainIdsIndex[1]= 97;
        _chainIdsIndex[2]= 42;
        _chainIdsIndex[3]= 1;
        // bytes32[] r = new bytes32[]('0x437df95b1704894db1e05f6847b585dae781fd68bab819ee4460265375d0fc0b','0xed4657f494c78ae95eaadf13765874bd2a9b7f53822234a3cc6a1bab150fe5f0');
        // bytes32[] memory s = ["0x342e4209024ac0d39d14799773e817978e68a348bf0811eef8f2ae6f1bc6e0e2","0x38be7f44d7e2a9eb75731a20fcf05bec843d05b75dd280026ef128d6341ca384"];
        // uint8[] memory v = ["0x1b","0x1c"];
        // uint256[] _chainIdsIndex = ['97', '97', '42', '1'];
        bytes32 _claimId = keccak256(
            abi.encode(
                "0x1111111111111111111111111111111111111111",
                "0x672253c7dd909356028277d8FcE656cAE2F559f2",
                "1000000",
                _chainIdsIndex,
                "0xa0ef9798e8bc4d4aab3d947ea8395f72e6378b94828bc3891716cafd510dc8d5",
                "Binance Testnet",
                "fBNB",
                "18"
            )
        );
        for (uint256 i = 0; i < r.length; i++) {
            address signer = ecrecover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        _claimId
                    )
                ),
                v[i],
                r[i],
                s[i]
            );
            signers[i] = signer;
        }
        return signers;
    }
}