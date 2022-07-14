// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// mock class using ERC20
contract ERC1155Mock is ERC1155 {
    constructor (
        string memory uri
    ) payable ERC1155(uri) {
    }

    function mint(address account, uint256 id, uint256 amount) public {
        _mint(account, id, amount, "");
    }

    function burn(uint256 id, uint256 amount) public {
        _burn(msg.sender, id, amount);
    }

}