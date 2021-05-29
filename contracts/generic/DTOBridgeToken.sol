pragma solidity ^0.7.0;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol"; // for WETH
import "@openzeppelin/contracts/access/Ownable.sol";
import "../lib/BlackholePrevention.sol";
import "./IDTOTokenBridge.sol";
import "./Governable.sol";

contract DTOBridgeToken is ERC20Burnable, Ownable, BlackholePrevention, IDTOTokenBridge, Governable {
    using SafeMath for uint256;
	mapping(bytes32 => bool) public alreadyClaims;
	address public originalTokenAddress;
	uint256 public chainId;

	constructor(address _originalTokenAddress, uint256 _chainId, string memory _tokenName, string memory _tokenSymbol, uint8 _decimals) public ERC20(_tokenName, _tokenSymbol) {
		_setupDecimals(_decimals);
		chainId = _chainId;
		originalTokenAddress = _originalTokenAddress;
    }

    function claimBridgeToken(address _originToken, address _to, uint256 _amount, uint256[] memory _chainIdsIndex, bytes32 _txHash) public override onlyGovernance {
		require(_chainIdsIndex.length == 3, "!_chainIdsIndex.length");
		require(_originToken == originalTokenAddress, "!originalTokenAddress");
		require(_chainIdsIndex[1] == chainId, "!invalid chainId");
		require(_to != address(0), "!invalid to");
		bytes32 _claimId = keccak256(abi.encode(_originToken, _to, _amount, _chainIdsIndex, _txHash, name(), symbol(), decimals()));
		require(!alreadyClaims[_claimId], "already claim");

		alreadyClaims[_claimId] = true;
		_mint(_to, _amount);
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