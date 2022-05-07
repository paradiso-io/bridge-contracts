pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol"; // for WETH
import "../interfaces/IDTOTokenBridge.sol";
// import "./Governable.sol";
import "../lib/ChainIdHolding.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract DTOBridgeToken is
    ERC20BurnableUpgradeable,
    IDTOTokenBridge,
    OwnableUpgradeable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;
    mapping(bytes32 => bool) public alreadyClaims;
    address public originalTokenAddress;
    uint256 public originChainId;
    uint8 _decimals;

    function initialize(
        address _originalTokenAddress,
        uint256 _originChainId,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 __decimals
    ) external initializer {
        __Ownable_init();
        __ChainIdHolding_init();
        __ERC20_init(_tokenName, _tokenSymbol);
        _decimals = __decimals;
        originalTokenAddress = _originalTokenAddress;
        originChainId = _originChainId;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function claimBridgeToken(
        address _originToken,
        address _to,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash
    ) public override onlyOwner {
        require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
        require(_originToken == originalTokenAddress, "!originalTokenAddress");
        require(_chainIdsIndex[2] == chainId, "!invalid chainId");
        require(_to != address(0), "!invalid to");
        bytes32 _claimId = keccak256(
            abi.encode(
                _originToken,
                _to,
                _amount,
                _chainIdsIndex,
                _txHash,
                name(),
                symbol(),
                decimals()
            )
        );
        require(!alreadyClaims[_claimId], "already claim");

        alreadyClaims[_claimId] = true;
        _mint(_to, _amount); //send token to bridge contract, which then distributes token and fee to user and governance
    }
}
