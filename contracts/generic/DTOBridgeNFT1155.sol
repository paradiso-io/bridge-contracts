pragma solidity 0.8.3;
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "../interfaces/IDTONFT1155Bridge.sol";
// import "./Governable.sol";
import "../lib/ChainIdHolding.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract DTOBridgeNFT1155 is
    ERC1155BurnableUpgradeable,
    IDTONFT1155Bridge,
    OwnableUpgradeable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;
    mapping(bytes32 => bool) public alreadyClaims;
    address public originalTokenAddress;
    uint256 public originChainId;

    function initialize(
        address _originalTokenAddress,
        uint256 _originChainId,
        string memory _tokenURI
    ) external initializer {
        __Ownable_init();
        __ChainIdHolding_init();
        __ERC1155_init(_tokenURI);
        originalTokenAddress = _originalTokenAddress;
        originChainId = _originChainId;
    }

    function claimBridgeToken(
        address _originToken,
        address _to,
        uint256 _id,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes memory _data
) public override onlyOwner {
        require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
        require(_originToken == originalTokenAddress, "!originalTokenAddress");
        require(_chainIdsIndex[2] == chainId, "!invalid chainId");
        require(_to != address(0), "!invalid to");

        _mint(_to, _id, _amount, _data); //send token to bridge contract, which then distributes token and fee to user and governance
    }
}
