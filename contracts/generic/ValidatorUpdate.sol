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
import {ECDSA} from "../lib/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

contract ValidatorUpdate is
    DTOUpgradeableBase,
    ReentrancyGuardUpgradeable,
    BlackholePreventionUpgrade,
    Governable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;
    mapping(bytes32 => uint256) public hashToEpoch;
    mapping(uint256 => bytes32) public epochToHash;
    uint256 public currentEpoch;
    uint256 public lastUpdatedAt;

    function initialize(address[] memory initialValidators) public initializer {
        currentEpoch = 1;

        __DTOUpgradeableBase_initialize();
        __Governable_initialize();
        __ChainIdHolding_init();

        governance = owner();
        bytes32 hash = keccak256(abi.encode(initialValidators));
        hashToEpoch[hash] = currentEpoch;
        epochToHash[currentEpoch] = hash;
    }

    function updateValidatorsHash(bytes memory dataAndProof) external returns (bool) {
        (bytes[] memory validatorData, bytes32[] memory newValidatorsHashes, uint256[] memory lastUpdatedAts, bytes[] memory signatures) = abi.decode(
            dataAndProof,
            (bytes[], bytes32[], uint256[], bytes[])
        );

        require(validatorData.length == signatures.length && signatures.length == lastUpdatedAts.length && lastUpdatedAts.length == newValidatorsHashes.length, "input invalid length");
        uint256 l = validatorData.length;
        for(uint256 i = 0; i < l; i++) {
            address[] memory validators = abi.decode(validatorData[i], (address[]));
            bytes32 validatorHash = keccak256(validatorData[i]);
            require(hashToEpoch[validatorHash] > 0, "invalid validators");
            require(lastUpdatedAts[i] > lastUpdatedAt, "invalid timestamp");
            _validateSignatures(ECDSA.toEthSignedMessageHash(keccak256(abi.encode(newValidatorsHashes[i], lastUpdatedAts[i]))), validators, signatures[i]);
            currentEpoch++;
            hashToEpoch[newValidatorsHashes[i]] = currentEpoch;
            epochToHash[currentEpoch] = newValidatorsHashes[i];
        }
        return true;
    }

    function _validateSignatures(
        bytes32 messageHash,
        address[] memory operators,
        bytes memory sig
    ) internal pure {
        bytes[] memory signatures = abi.decode(sig, (bytes[]));
        uint256 operatorsLength = operators.length;
        require(operatorsLength > 0 && operatorsLength == signatures.length, "malformed signature");
        // looking for signers within operators
        // assuming that both operators and signatures are sorted
        address previousSigner = address(0);
        for (uint256 i = 0; i < operatorsLength; ++i) {
            address signer = ECDSA.recover(messageHash, signatures[i]);
            if (i != operatorsLength - 1) {
                require(previousSigner < signer, "validators must be increasing order");
            }
            previousSigner = signer;
            require(signer == operators[i], "invalid signature");
        }
    }
}
