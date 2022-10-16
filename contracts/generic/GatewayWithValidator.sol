pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../lib/BlackholePreventionUpgrade.sol";
import "./DTOBridgeToken.sol";
import "../interfaces/IDTOTokenBridge.sol";
import "./Governable.sol";
import "../lib/ChainIdHolding.sol";
import "../lib/DTOUpgradeableBase.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "../interfaces/IClaim2.sol";

contract GatewayWithValidator is
    DTOUpgradeableBase,
    ReentrancyGuardUpgradeable,
    BlackholePreventionUpgrade,
    Governable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address payable;

    uint256 public constant CONSENSUS_PERCENTAGE = 66;
    address public bridge;
    event ClaimTokenWithValidators(
        address indexed _token,
        address indexed _toAddr,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index,
        bytes32 _claimId
    );

    function initialize(address _bridge) public initializer {
        __DTOUpgradeableBase_initialize();
        __Governable_initialize();
        __ChainIdHolding_init();
        governance = owner();

        bridge = _bridge;
    }

    function verifySignatures(
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        bytes32 message,
        address[] memory validators
    ) internal pure returns (bool) {
        bytes32 signedData = keccak256(abi.encode(validators, message));
        uint256 requiredSignature = (validators.length * CONSENSUS_PERCENTAGE) / 100;
        if (requiredSignature * 100 != validators.length * CONSENSUS_PERCENTAGE) {
            requiredSignature = requiredSignature + 1;
        }

        require(
            r.length == s.length &&
                s.length == v.length &&
                v.length >= requiredSignature,
            "insufficient validators for agreement"
        );

        uint256 signaturesCount = r.length;
        uint256 goodSignersCount = 0;
        uint256 lastSignerIndex = 0;

        for (uint256 i = 0; i < signaturesCount; i++) {
            address signer = ecrecover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        signedData
                    )
                ),
                v[i],
                r[i],
                s[i]
            );

            // as validators are in increasing order, the signatures are needed in the increasing order too
            for (uint256 k = lastSignerIndex; k < validators.length; k++) {
                if (validators[k] == signer) {
                    goodSignersCount++;
                    lastSignerIndex = k;
                    break;
                }
            }
        }

        return goodSignersCount >= requiredSignature;
    }

    //@dev: _claimData: includex tx hash, event index, event data
    //@dev _tokenInfos: contain token name and symbol of bridge token
    //_chainIdsIndex: length = 4, _chainIdsIndex[0] = originChainId, _chainIdsIndex[1] => fromChainId, _chainIdsIndex[2] = toChainId = this chainId, _chainIdsIndex[3] = index
    function claimToken(
        address[] memory validators,
        address _originToken,
        address _toAddr,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        string[2] memory _nameAndSymbol,
        uint8 _decimals
    ) external payable nonReentrant {
        require(
            _chainIdsIndex.length == 4 && chainId == _chainIdsIndex[2],
            "!chain id claim"
        );
        
        require(
            verifySignatures(
                r,
                s,
                v,
                keccak256(
                    abi.encode(
                        _originToken,
                        _toAddr,
                        _amount,
                        _chainIdsIndex,
                        _txHash,
                        _nameAndSymbol[0],
                        _nameAndSymbol[1],
                        _decimals
                    )
                ),
                validators
            ),
            "invalid signatures"
        );
        IClaim2(bridge).claimToken(
            _originToken,
            _toAddr,
            _amount,
            _chainIdsIndex,
            _txHash,
            _nameAndSymbol[0],
            _nameAndSymbol[1],
            _decimals
        );
    }
}
