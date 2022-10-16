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

contract ValidatorSigner is
    DTOUpgradeableBase,
    ReentrancyGuardUpgradeable,
    BlackholePreventionUpgrade,
    Governable,
    ChainIdHolding
{
    using SafeMathUpgradeable for uint256;

    event Sign(address _signer, uint256 _blockNumber, bytes32 _blockHash);

    mapping(bytes32 => address[]) public blockSigners;
    mapping(uint256 => bytes32[]) public blocks;
    //this is block per epoch
    uint256 public epochNumber;

    mapping(uint256 => address[]) public signersForEpoch;
    mapping(uint256 => uint256) public epochStart;

    //signing messages
    mapping(bytes32 => address[]) public signersForMessage;
    mapping(bytes32 => mapping(address => bool)) public signerMapForEasyCheck;
    mapping(address => bytes32[]) public signedMessages;
    mapping(address => uint256) public signedMessagesCount;
    mapping(bytes32 => bytes[]) public signatures;
    mapping(bytes32 => uint256) public messageToEpoch;

    uint256 public epochCounter;

    event SignedMessage(address validator, uint256 epoch, bytes32 message, bytes data);

    function BlockSigner(uint256 _epochNumber) public {
        epochNumber = _epochNumber;
    }

    function initialize(uint256 _epochNumber) public initializer {
        epochNumber = _epochNumber;

        __DTOUpgradeableBase_initialize();
        __Governable_initialize();
        __ChainIdHolding_init();

        governance = owner();
    }

    function sign(uint256 _blockNumber, bytes32 _blockHash) external {
        // consensus should validate all senders are validators, gas = 0
        require(block.number >= _blockNumber);
        require(block.number <= _blockNumber.add(epochNumber * 2));
        blocks[_blockNumber].push(_blockHash);
        blockSigners[_blockHash].push(msg.sender);

        emit Sign(msg.sender, _blockNumber, _blockHash);
    }

    function getSigners(bytes32 _blockHash)
        public
        view
        returns (address[] memory)
    {
        return blockSigners[_blockHash];
    }

    // timestamp at which the transaction for message occurs
    function publishSignature(
        uint256 epoch,
        uint256 timestamp,
        bytes32 message,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) external {
        address sender = msg.sender;
        require(signerMapForEasyCheck[message][sender], "already signed");
        address[] memory validators = signersForEpoch[epoch];
        require(
            validators.length > 0 && epochStart[epoch] > 0,
            "validators not set yet"
        );

        require(
            timestamp >= epochStart[epoch] && (timestamp < epochStart[epoch + 1] || epochStart[epoch + 1] == 0),
            "invalid epoch"
        );

        bool foundInEpoch = false;
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i] == sender) {
                foundInEpoch = true;
                break;
            }
        }

        bytes32 validatorHash = keccak256(abi.encode(validators, message));

        address recovered = ecrecover(
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    validatorHash
                )
            ),
            v,
            r,
            s
        );

        require(recovered == sender, "invalid validator");

        signersForMessage[message].push(sender);
        signedMessages[sender].push(message);
        signedMessagesCount[sender]++;
        signerMapForEasyCheck[message][sender] = true;

        bytes memory bytesSig = abi.encode(r, s, v);
        signatures[message].push(bytesSig);
        messageToEpoch[message] = epoch;

        emit SignedMessage(sender, epoch, message, bytesSig);
    }

    function setSignersForEpoch(uint256 epoch, address[] memory validators, uint256 epochStartTime) external onlyOwner {
        epochCounter++;
        require(epoch == epochCounter, "invalid epoch");
        signersForEpoch[epoch] = validators;
        epochStart[epoch] = epochStartTime;
        //validators must be in increasing order
        for(uint256 i = 0; i < validators.length - 1; i++) {
            require(validators[i] < validators[i + 1], "invalid increasing orders");
        }
    }

    // getter
    function getSignersForEpoch(uint256 epoch)
        external
        view
        returns (address[] memory)
    {
        return signersForEpoch[epoch];
    }

    function getSignersForMessage(bytes32 message)
        external
        view
        returns (address[] memory)
    {
        return signersForMessage[message];
    }

    function getTotalSignedMessageCount(address validator)
        external
        view
        returns (uint256)
    {
        return signedMessagesCount[validator];
    }

    function getSignedMessages(
        address validator,
        uint256 fromIndex,
        uint256 toIndex
    ) external view returns (bytes32[] memory ret) {
        uint256 count = signedMessagesCount[validator];
        if (fromIndex >= count) {
            return ret;
        }

        toIndex = toIndex < count ? toIndex : count - 1;
        count = toIndex - fromIndex + 1;
        ret = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            ret[i] = signedMessages[validator][fromIndex + i];
        }
    }

    function getSignaturesForMessage(bytes32 message)
        external
        view
        returns (bytes[] memory)
    {
        return signatures[message];
    }
}
