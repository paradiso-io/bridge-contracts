pragma solidity 0.8.3;
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol"; // for WETH
import "../interfaces/IDTOTokenBridge.sol";
// import "./Governable.sol";
import "../lib/ChainIdHolding.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract DTOBridgeNFT721 is
    ERC721BurnableUpgradeable,
    IDTOTokenBridge,
    OwnableUpgradeable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;
    mapping(bytes32 => bool) public alreadyClaims;
    address public originalTokenAddress;
    uint256 public originChainId;

    function initialize(
        address _originalTokenAddress,
        address _miner,
        uint256 _originChainId,
        string memory _tokenName,
        string memory _tokenSymbol
    ) external initializer {
        __Ownable_init();
        __ChainIdHolding_init();
        __ERC721_init(_tokenName, _tokenSymbol);
        originalTokenAddress = _originalTokenAddress;
        originChainId = _originChainId;
    }

    function claimBridgeToken(
        address _originToken,
        address _to,
        uint256 _tokenId,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash
    ) public override onlyOwner {
        require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
        require(_originToken == originalTokenAddress, "!originalTokenAddress");
        require(_chainIdsIndex[2] == chainId, "!invalid chainId");
        require(_to != address(0), "!invalid to");

        _mint(_to, _tokenId);
    }
}
