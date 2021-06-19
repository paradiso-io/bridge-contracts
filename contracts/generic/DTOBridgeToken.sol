pragma solidity 0.5.17;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol"; // for WETH
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../lib/BlackholePrevention.sol";
import "./IDTOTokenBridge.sol";
import "./Governable.sol";

contract DTOBridgeToken is ERC20Burnable, ERC20Detailed, Ownable, BlackholePrevention, IDTOTokenBridge, Governable {
    using SafeMath for uint256;
	mapping(bytes32 => bool) public alreadyClaims;
	address public originalTokenAddress;
	uint256 public chainId;

	constructor(address _originalTokenAddress, string memory _tokenName, string memory _tokenSymbol, uint8 _decimals) public ERC20Detailed(_tokenName, _tokenSymbol, _decimals) {
		uint _chainId;
        assembly {
            _chainId := chainid()
        }
		chainId = _chainId;
		originalTokenAddress = _originalTokenAddress;
    }

    function claimBridgeToken(address _originToken, address _to, uint256 _amount, uint256[] memory _chainIdsIndex, bytes32 _txHash) public onlyGovernance {
		require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
		require(_originToken == originalTokenAddress, "!originalTokenAddress");
		require(_chainIdsIndex[2] == chainId, "!invalid chainId");
		require(_to != address(0), "!invalid to");
		bytes32 _claimId = keccak256(abi.encode(_originToken, _to, _amount, _chainIdsIndex, _txHash, name(), symbol(), decimals()));
		require(!alreadyClaims[_claimId], "already claim");

		alreadyClaims[_claimId] = true;
		_mint(_to, _amount);	//send token to bridge contract, which then distributes token and fee to user and governance
	}

  function withdrawEther(address payable receiver, uint256 amount) external onlyGovernance {
    _withdrawEther(receiver, amount);
  }

  function withdrawERC20(address payable receiver, address tokenAddress, uint256 amount) external onlyGovernance {
    _withdrawERC20(receiver, tokenAddress, amount);
  }

  function withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) external onlyGovernance {
    _withdrawERC721(receiver, tokenAddress, tokenId);
  }
}