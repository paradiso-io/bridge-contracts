// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Mock is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string public defaultURI;
    constructor() ERC721('GFC Faucet', 'GFC')
    {
        defaultURI = "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/";
    }

    function mint() external {
        uint256 tokenId = totalSupply();
        _mint(msg.sender, tokenId);     
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory)
    {
        require(tokenId < totalSupply(), "Token not exist.");
        //If tokenURI is not set, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(defaultURI, tokenId.toString()));
    }
} 