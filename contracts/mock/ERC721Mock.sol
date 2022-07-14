// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// mock class using ERC20
contract ERC721Mock is ERC721 {
    constructor (
        string memory name,
        string memory symbol
    ) payable ERC721(name, symbol) {
    }

    function mint(address account, uint256 tokenId) public {
        _mint(account, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

}