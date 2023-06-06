pragma solidity 0.8.3;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "../lib/ChainIdHolding.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IEventHook.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

// ownable must be a timelock
contract WrapNonEVMERC20 is
    ERC20Burnable,
    Ownable,
    ChainIdHolding,
    ReentrancyGuard
{   
    using AddressUpgradeable for address payable;
    using SafeMath for uint256;
    mapping(bytes32 => bool) public alreadyClaims;
    mapping(bytes32 => bool) public alreadyClaimedTxHashes;
    bytes public originalTokenAddress;
    string public originalTokenAddressString;
    uint256 public originChainId;
    uint8 _decimals;

    address[] public bridgeApprovers;
    mapping(address => bool) public approverMap;
    address payable public feeReceiver;
    uint256 public index;
    uint256 public minApprovers;
    IEventHook public eventHook;
    uint256 public nativeFee;

    //_token is the origin token, regardless it's bridging from or to the origini token
    event RequestBridge(
        bytes indexed _token,
        bytes _toAddr,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index
    );
    event ClaimToken(
        bytes indexed _token,
        address indexed _toAddr,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index,
        bytes32 _claimId
    );

    constructor(
        string memory _originalTokenAddress,
        uint256 _originChainId,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 __decimals,
        address payable _feeReceiver,
        address _eventHook
    ) ERC20(_tokenName, _tokenSymbol) {
        __ChainIdHolding_init();
        _decimals = __decimals;
        originalTokenAddressString = _originalTokenAddress;
        originalTokenAddress = abi.encode(_originalTokenAddress);
        originChainId = _originChainId;

        minApprovers = 2;
        feeReceiver = _feeReceiver;
        index = 0;

        eventHook = IEventHook(_eventHook);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function verifySignatures(
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        bytes32 signedData
    ) internal returns (bool) {
        require(
            minApprovers >= 2 &&
                minApprovers >= (bridgeApprovers.length * 2) / 3,
            "!min approvers"
        );
        require(bridgeApprovers.length >= minApprovers, "!min approvers");
        uint256 successSigner = 0;
        if (
            r.length == s.length &&
            s.length == v.length &&
            v.length >= minApprovers
        ) {
            address lastRecoveredSigner = address(0);
            for (uint256 i = 0; i < r.length; i++) {
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
                require(
                    lastRecoveredSigner < signer,
                    "signatures must be in increasing orders of signers"
                );
                lastRecoveredSigner = signer;
                if (approverMap[signer]) {
                    successSigner++;
                }
            }
        }

        return successSigner >= minApprovers;
    }

    function setNativeFee(uint256 fee) external onlyOwner {
        nativeFee = fee;
    }

    function claimToken(
        address _to,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v
    ) external nonReentrant {
        require(_chainIdsIndex.length == 4, "!_chainIdsIndex.length");
        require(_chainIdsIndex[0] == originChainId, "!invalid origin chainId");
        require(_chainIdsIndex[1] == originChainId, "!invalid from chainId");
        require(_chainIdsIndex[2] == chainId, "!invalid to chainId");
        require(_to != address(0), "!invalid to");
        bytes32 _claimId = keccak256(
            abi.encode(
                originalTokenAddressString,
                originalTokenAddress,
                _to,
                _amount,
                _chainIdsIndex,
                _txHash
            )
        );
        require(!alreadyClaims[_claimId], "already claim");
        require(!alreadyClaimedTxHashes[_txHash], "already claim tx hash");

        require(verifySignatures(r, s, v, _claimId), "invalid signatures");

        alreadyClaims[_claimId] = true;
        alreadyClaimedTxHashes[_txHash] = true;
        _mint(_to, _amount);

        emit ClaimToken(
            originalTokenAddress,
            _to,
            _amount,
            _chainIdsIndex[0],
            _chainIdsIndex[1],
            chainId,
            _chainIdsIndex[3],
            _claimId
        );

        if (address(eventHook) != address(0)) {
            eventHook.postClaimToken(
                originalTokenAddress,
                _to,
                _amount,
                _chainIdsIndex[0],
                _chainIdsIndex[1],
                chainId,
                _chainIdsIndex[3],
                _claimId
            );
        }
    }

    function requestBridge(
        bytes memory _toAddr,
        uint256 _amount
    ) public payable nonReentrant {
        require(msg.value >= nativeFee, "invalid fee");
        if (msg.value > 0) {
            payable(feeReceiver).sendValue(msg.value);
        }
        _burn(msg.sender, _amount);

        emit RequestBridge(
            originalTokenAddress,
            _toAddr,
            _amount,
            originChainId,
            chainId,
            originChainId,
            index
        );

        if (address(eventHook) != address(0)) {
            eventHook.postRequestBridge(
                originalTokenAddress,
                _toAddr,
                _amount,
                originChainId,
                chainId,
                originChainId,
                index
            );
        }
        ++index;
    }

    function setMinApprovers(uint256 _val) public onlyOwner {
        require(
            _val >= 2 && minApprovers >= (bridgeApprovers.length * 2) / 3,
            "!min set approver"
        );
        minApprovers = _val;
    }

    function addApprovers(address[] memory _addrs) public onlyOwner {
        uint256 addressCount = _addrs.length;
        for (uint256 i = 0; i < addressCount; ++i) {
            if (!approverMap[_addrs[i]]) {
                bridgeApprovers.push(_addrs[i]);
                approverMap[_addrs[i]] = true;
            }
        }
    }

    function removeApprover(address _addr) public onlyOwner {
        require(approverMap[_addr], "not approver");
        uint256 count = bridgeApprovers.length;
        for (uint256 i = 0; i < count; ++i) {
            if (bridgeApprovers[i] == _addr) {
                bridgeApprovers[i] = bridgeApprovers[
                    bridgeApprovers.length - 1
                ];
                bridgeApprovers.pop();
                approverMap[_addr] = false;
                return;
            }
        }
    }
}
