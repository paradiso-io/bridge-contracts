pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol"; // for WETH
import "../interfaces/IDTONFT721Bridge.sol";
// import "./Governable.sol";
import "../lib/ChainIdHolding.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract DTOBridgeNFT721 is
    ERC721BurnableUpgradeable,
    IDTONFT721Bridge,
    OwnableUpgradeable,
    ChainIdHolding
{
    using StringsUpgradeable for uint256;
    using SafeMathUpgradeable for uint256;
    mapping(bytes32 => bool) public alreadyClaims;
    bytes public originalTokenAddress;
    uint256 public originChainId;
    string public baseURI;

    function initialize(
        bytes memory _originalTokenAddress,
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

        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, StringsUpgradeable.toString(tokenId))) : '';
    }

    function updateBaseURI(string memory _newURI) public override onlyOwner {
        baseURI = _newURI;
    }

    function claimBridgeToken(
        bytes memory _originToken,
        address _to,
        uint256 _tokenId,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash
    ) public override onlyOwner {
        require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
        require(keccak256(_originToken) == keccak256(originalTokenAddress), "!originalTokenAddress");
        require(_chainIdsIndex[2] == chainId, "!invalid chainId");
        require(_to != address(0), "!invalid to");

        _mint(_to, _tokenId);
    }
}
