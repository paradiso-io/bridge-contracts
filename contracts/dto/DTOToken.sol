// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; // for WETH
import "@openzeppelin/contracts/access/Ownable.sol";

//token owner will be a time lock contract after farming started
contract DTOToken is Context, Ownable, ERC20 {
	uint256 public constant MAX_SUPPLY = 100000000e18;

	constructor() public ERC20("DOTORACLE.NETWORK", "DTO") {
		_mint(msg.sender, MAX_SUPPLY);
    }
}
