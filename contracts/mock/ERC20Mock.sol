// SPDX-License-Identifier: MIT

pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

// mock class using ERC20
contract ERC20Mock is ERC20Detailed, ERC20Mintable {
    constructor (
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) public payable ERC20Detailed(name, symbol, 18) {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account) public {
        _mint(account, 1000e18);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        _approve(owner, spender, value);
    }
}