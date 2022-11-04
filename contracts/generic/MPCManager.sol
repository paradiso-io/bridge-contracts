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
import {SECP256K1} from "../lib/SECP256K1.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

contract MPCManager is
    DTOUpgradeableBase,
    ReentrancyGuardUpgradeable,
    BlackholePreventionUpgrade,
    Governable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;

    uint256 public constant TYPE_SIGNING_BROADCAST_MESSAGE = 0;
    uint256 public constant TYPE_KEYGEN_BROADCAST_MESSAGE = 1;
    uint256 public constant TYPE_SIGNING_P2P_MESSAGE = 2;
    uint256 public constant TYPE_KEYGEN_P2P_MESSAGE = 3;

    address[] public validators;
    uint256 public validatorUpdateCount;

    struct ValidatorBroadcastData {
        uint256 round;
        bytes data;
    }

    struct Signature {
        bytes32 message;
        bytes32 validatorHash;
        bytes signature;
    }

    struct MPCPubkey {
        bytes pubkey;
        address mpcAddress;
    }

    // signing message: message => validator => data
    mapping(bytes32 => mapping(address => ValidatorBroadcastData[]))
        public signingBroadcastData;
    mapping(bytes32 => Signature) public signature;

    // validatorHash => validator => data
    mapping(bytes32 => mapping(address => ValidatorBroadcastData[]))
        public keygenBroadcastData;
    mapping(uint256 => MPCPubkey) public keyGenDone;

    // message => PeerPair hash => data
    // PeerPair hash = kecckak256(abi.encode(from, to))
    mapping(bytes32 => mapping(bytes32 => ValidatorBroadcastData[]))
        public p2pSigningData;
    mapping(bytes32 => mapping(bytes32 => ValidatorBroadcastData[]))
        public p2pKeygenData;

    event ValidatorUpdate(bytes newValidators, uint256 updateCount);

    modifier onlyValidator() {
        require(isValidator(msg.sender), "not validator");
        _;
    }

    function isValidatorsOrder(address[] memory _validators)
        public
        pure
        returns (bool)
    {
        if (_validators.length <= 1) return true;
        uint256 i = 0;
        for (i = 0; i < _validators.length - 1; i++) {
            if (_validators[i] >= _validators[i + 1]) {
                return false;
            }
        }
        return true;
    }

    function setSignature(bytes32 message, bytes memory sig)
        external
        onlyValidator
    {
        bytes memory currentMPC = keyGenDone[validatorUpdateCount].pubkey;

        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(sig, 0x20))
            s := mload(add(sig, 0x40))
            v := byte(0, mload(add(sig, 0x60)))
        }
        (uint256 x, uint256 y) = SECP256K1.recover(uint256(message), v - 27, uint256(r), uint256(s));
        require(keccak256(abi.encodePacked(x, y)) == keccak256(currentMPC), "invalid mpc signature");
        signature[message] = Signature({ message: message, signature: sig, validatorHash: keccak256(abi.encode(validators)) });
    }

    function initialize(address[] memory initialValidators) public initializer {
        require(isValidatorsOrder(initialValidators), "not good validators");
        validatorUpdateCount = 0;

        __DTOUpgradeableBase_initialize();
        __Governable_initialize();
        __ChainIdHolding_init();

        governance = owner();
        validators = initialValidators;
    }

    function updateValidators(address[] memory newValidators)
        external
        onlyOwner
    {
        require(isValidatorsOrder(newValidators), "not good validators");
        validators = newValidators;
        validatorUpdateCount++;
        emit ValidatorUpdate(abi.encode(newValidators), validatorUpdateCount);
    }

    function put(bytes memory m) external onlyValidator {
        (bytes32 message, uint256 messageType, bytes memory d) = abi.decode(
            m,
            (bytes32, uint256, bytes)
        );
        if (
            message == keccak256(abi.encode(validators, validatorUpdateCount))
        ) {
            require(
                keyGenDone[validatorUpdateCount].mpcAddress == address(0),
                "!keyGenDone"
            );
            if (messageType == TYPE_KEYGEN_BROADCAST_MESSAGE) {
                (uint256 round, bytes memory data) = abi.decode(
                    d,
                    (uint256, bytes)
                );
                require(
                    round == keygenBroadcastData[message][msg.sender].length,
                    "round already published"
                );
                keygenBroadcastData[message][msg.sender].push(
                    ValidatorBroadcastData({round: round, data: data})
                );
            } else if (messageType == TYPE_KEYGEN_P2P_MESSAGE) {
                (uint256 round, bytes32 peerPairHash, bytes memory data) = abi
                    .decode(d, (uint256, bytes32, bytes));
                require(
                    round == p2pKeygenData[message][peerPairHash].length,
                    "round already published"
                );
                p2pKeygenData[message][peerPairHash].push(
                    ValidatorBroadcastData({round: round, data: data})
                );
            } else {
                revert("invalid message type");
            }
        } else {
            if (messageType == TYPE_SIGNING_BROADCAST_MESSAGE) {} else if (
                messageType == TYPE_SIGNING_P2P_MESSAGE
            ) {}
            revert("invalid message type");
        }
    }

    function getValidators() external view returns (address[] memory) {
        return validators;
    }

    function getSigningBroadcastMessages(bytes32 message, address validator)
        external
        view
        returns (ValidatorBroadcastData[] memory)
    {
        return signingBroadcastData[message][validator];
    }

    function getKeyGenBroadcastMessages(bytes32 message, address validator)
        external
        view
        returns (ValidatorBroadcastData[] memory)
    {
        return keygenBroadcastData[message][validator];
    }

    function getSigningPeerMessages(bytes32 message, bytes32 peerHash)
        external
        view
        returns (ValidatorBroadcastData[] memory)
    {
        return p2pSigningData[message][peerHash];
    }

    function getKeygenPeerMessages(bytes32 message, bytes32 peerHash)
        external
        view
        returns (ValidatorBroadcastData[] memory)
    {
        return p2pKeygenData[message][peerHash];
    }

    function isValidator(address addr) public view returns (bool) {
        bool found = false;
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i] == addr) {
                found = true;
                break;
            }
        }
        return found;
    }
}
