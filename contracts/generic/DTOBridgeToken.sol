pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol"; // for WETH
import "../lib/BlackholePrevention.sol";
import "../interfaces/IDTOTokenBridge.sol";
import "./Governable.sol";
import "../lib/ChainIdHolding.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

contract DTOBridgeToken is ERC20BurnableUpgradeable, BlackholePrevention, IDTOTokenBridge, Governable, ChainIdHolding {
    using SafeMath for uint256;
	mapping(bytes32 => bool) public alreadyClaims;
	address public originalTokenAddress;
	uint8 _decimals;
	constructor(address _originalTokenAddress, string memory _tokenName, string memory _tokenSymbol, uint8 __decimals) public{
		__ERC20_init(_tokenName, _tokenSymbol);
		_decimals= __decimals;
		originalTokenAddress = _originalTokenAddress;
    }
	 function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    function claimBridgeToken(address _originToken, address _to, uint256 _amount, uint256[] memory _chainIdsIndex, bytes32 _txHash) public override onlyGovernance {
		require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
		require(_originToken == originalTokenAddress, "!originalTokenAddress");
		require(_chainIdsIndex[2] == chainId, "!invalid chainId");
		require(_to != address(0), "!invalid to");
		bytes32 _claimId = keccak256(abi.encode(_originToken, _to, _amount, _chainIdsIndex, _txHash, name(), symbol(), decimals()));
		require(!alreadyClaims[_claimId], "already claim");

		alreadyClaims[_claimId] = true;
		_mint(_to, _amount);	//send token to bridge contract, which then distributes token and fee to user and governance
	}

  function withdrawEther(address payable receiver, uint256 amount) external virtual onlyGovernance {
    _withdrawEther(receiver, amount);
  }

  function withdrawERC20(address payable receiver, address tokenAddress, uint256 amount) external virtual onlyGovernance {
    _withdrawERC20(receiver, tokenAddress, amount);
  }

  function withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) external virtual onlyGovernance {
    _withdrawERC721(receiver, tokenAddress, tokenId);
  }
}