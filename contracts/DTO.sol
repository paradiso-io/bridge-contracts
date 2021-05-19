// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol"; // for WETH
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IClaim.sol";

//token owner will be a time lock contract after farming started
contract DTO is Context, Ownable, ERC20Burnable, IClaim {
    using SafeMath for uint256;
    using Address for address;

	uint256 public constant MAX_SUPPLY = 100000000e18;
	uint256 public chainId;
	mapping(address => bool) public bridges;
	mapping(uint256 => bool) public alreadyClaims;

	constructor(address _tokenRecipient, uint256 _initialAmount, uint256 _chainId) public ERC20("DOTORACLE.NETWORK", "DTO") {
		_mint(_tokenRecipient, _initialAmount);
		chainId = _chainId;
    }

	modifier onlyBridge() {
		require(bridges[msg.sender], "!bridge contract");
		_;
	}

	function setBridge(address _addr, bool _val) public onlyOwner {
		bridges[_addr] = _val;
	}

	function claimBridgeToken(address _to, uint256 _amount, uint256 _chainId, uint256 _claimId) public override onlyBridge {
		require(_chainId == chainId, "!invalid chainId");
		require(_to != address(0), "!invalid to");
		require(_amount.add(totalSupply()) <= MAX_SUPPLY, "!invalid amount");
		require(!alreadyClaims[_claimId], "already claim");

		alreadyClaims[_claimId] = true;
		_mint(_to, _amount);
	}

	function burnForBridge(address _burner, uint256 _amount) public override onlyBridge {
        _burn(_burner, _amount);
	}
}
