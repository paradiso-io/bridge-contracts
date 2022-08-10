pragma solidity ^0.8.0;
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
    string public baseURI;
    string public suffix;

    function initialize(
        address _originalTokenAddress,
        address _miner,
        uint256 _originChainId,
        string memory _tokenName,
        string memory _tokenSymbol
//        string memory _tokenBaseURI
    ) external initializer {
        __Ownable_init();
        __ChainIdHolding_init();
        __ERC721_init(_tokenName, _tokenSymbol);
        originalTokenAddress = _originalTokenAddress;
        originChainId = _originChainId;
//        baseURI = _tokenBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
//
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString()), suffix) : "";
    }

    function updateBaseURI(string memory _newURI, string memory _suffix) public override onlyOwner {
        baseURI = _newURI;
        suffix = _suffix;
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
