pragma solidity ^0.8.0;
import "../lib/BlackholePreventionUpgrade.sol";
import "./DTOBridgeNFT1155.sol";
import "../interfaces/IDTONFT1155Bridge.sol";
import "./Governable.sol";
import "./CheckNftType.sol";
import "../lib/ChainIdHolding.sol";
import "../lib/DTOUpgradeableBase.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

contract NFT1155Bridge is
    CheckNftType,
    DTOUpgradeableBase,
    ReentrancyGuardUpgradeable,
    BlackholePreventionUpgrade,
    Governable,
    ChainIdHolding
    {
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address payable;


    struct TokenInfo {
        address addr;
        uint256 chainId;
    }

    function checkSupportToken(address _tokenAddress) public view returns (bool) {
        if (isERC721(_tokenAddress) || isERC1155(_tokenAddress)) {
            return true;
        }
        return false;
    }

    mapping(bytes32 => bool) public alreadyClaims;
    address[] public bridgeApprovers;
    mapping(address => bool) public approverMap; //easily check approver signature
    mapping(uint256 => bool) public supportedChainIds;
    mapping(address => uint256[]) public tokenMapList; //to which chain ids this token is bridged to
    mapping(address => mapping(uint256 => bool)) public tokenMapSupportCheck; //to which chain ids this token is bridged to
    mapping(uint256 => mapping(address => address)) public tokenMap; //chainid => origin token => bridge token
    mapping(address => TokenInfo) public tokenMapReverse; //bridge token => chain id => origin token
    mapping(address => bool) public bridgeNFT721Tokens; //mapping of bridge tokens on this chain
    mapping(address => bool) public bridgeNFT1155Tokens; //mapping of bridge tokens on this chain
    uint256 public nativeFee; //fee paid in native token for nodes maintenance

    uint256 public index;
    uint256 public minApprovers;
    address payable public feeReceiver;
    uint256 public defaultFeePercentage;
    uint256 public constant DEFAULT_FEE_DIVISOR = 10_000;
    uint256 public constant DEFAULT_FEE_PERCENTAGE = 10; //0.1%

    //_token is the origin token, regardless it's bridging from or to the origini token
    event RequestNFT1155Bridge(
        address indexed _token,
        bytes _toAddr,
        uint256 _id,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index
    );
    event ClaimNFT1155(
        address indexed _token,
        address indexed _toAddr,
        uint256 _id,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index,
        bytes32 _claimId
    );
    event ValidatorSign(
        address _validator,
        bytes32 _claimId,
        uint256 _timestamp
    );

    function initialize(uint256[] memory _chainIds) public initializer {
        __DTOUpgradeableBase_initialize();
        __Governable_initialize();
        __ChainIdHolding_init();
        supportedChainIds[chainId] = true;
        minApprovers = 2;
        nativeFee = 0;
        governance = owner();

        for (uint256 i = 0; i < _chainIds.length; i++) {
            supportedChainIds[_chainIds[i]] = true;
        }
        defaultFeePercentage = DEFAULT_FEE_PERCENTAGE; //0.1 %
    }

    function setMinApprovers(uint256 _val) public onlyGovernance {
        require(_val >= 2, "!min set approver");
        minApprovers = _val;
    }

    function setFeeReceiver(address payable _feeReceiver)
    external
    onlyGovernance
    {
        feeReceiver = _feeReceiver;
    }

    function addApprover(address _addr) public onlyGovernance {
        require(!approverMap[_addr], "already approver");
        require(_addr != address(0), "non zero address");
        bridgeApprovers.push(_addr);
        approverMap[_addr] = true;
    }

    function addApprovers(address[] memory _addrs) public onlyGovernance {
        for (uint256 i = 0; i < _addrs.length; i++) {
            if (!approverMap[_addrs[i]]) {
                bridgeApprovers.push(_addrs[i]);
                approverMap[_addrs[i]] = true;
            }
        }
    }

    function removeApprover(address _addr) public onlyGovernance {
        require(approverMap[_addr], "not approver");
        for (uint256 i = 0; i < bridgeApprovers.length; i++) {
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

    function setSupportedChainId(uint256 _chainId, bool _val)
    public
    onlyGovernance
    {
        supportedChainIds[_chainId] = _val;
    }

    function setSupportedChainIds(uint256[] memory _chainIds, bool _val)
    public
    onlyGovernance
    {
        for (uint256 i = 0; i < _chainIds.length; i++) {
            supportedChainIds[_chainIds[i]] = _val;
        }
    }

    function setGovernanceFee(uint256 _fee) public onlyGovernance {
        nativeFee = _fee;
    }


    function verifySignatures(
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        bytes32 signedData
    ) internal returns (bool) {
        require(minApprovers >= 2, "!min approvers");
        require(bridgeApprovers.length >= minApprovers, "!min approvers");
        uint256 successSigner = 0;
        if (
            r.length == s.length &&
            s.length == v.length &&
            v.length >= minApprovers
        ) {
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
                if (approverMap[signer]) {
                    successSigner++;
                    emit ValidatorSign(signer, signedData, block.timestamp);
                }
            }
        }

        return successSigner >= minApprovers;
    }





    function requestNFT1155Bridge(
        address _tokenAddress,
        bytes memory _toAddr,
        uint256 _id,
        uint256 _amount,
        uint256 _toChainId
    ) public payable nonReentrant {
        require(
            chainId != _toChainId,
            "source and target chain ids must be different"
        );
        require(checkSupportToken(_tokenAddress), "unsupported this token");
        require(msg.value >= nativeFee, "fee is low");
        feeReceiver.transfer(msg.value);

        require(supportedChainIds[_toChainId], "unsupported chainId");
        if (!isBridgeToken(_tokenAddress)) {

            emit RequestNFT1155Bridge(
                _tokenAddress,
                _toAddr,
                _id,
                _amount,
                chainId,
                chainId,
                _toChainId,
                index
            );
            index++;

            if (!tokenMapSupportCheck[_tokenAddress][_toChainId]) {
                tokenMapList[_tokenAddress].push(_toChainId);
                tokenMapSupportCheck[_tokenAddress][_toChainId] = true;
            }
        } else {
            address _originToken = tokenMapReverse[_tokenAddress].addr;
            ERC1155BurnableUpgradeable(_originToken).burn(
                msg.sender, _id,
                _amount
            );
            emit RequestNFT1155Bridge(
                _originToken,
                _toAddr,
                _id,
                _amount,
                tokenMapReverse[_tokenAddress].chainId,
                chainId,
                _toChainId,
                index
            );
            index++;
        }
    }

    //@dev: _claimData: includex tx hash, event index, event data
    //@dev _tokenInfos: contain token name and symbol of bridge token
    //_chainIdsIndex: length = 4, _chainIdsIndex[0] = originChainId, _chainIdsIndex[1] => fromChainId, _chainIdsIndex[2] = toChainId = this chainId, _chainIdsIndex[3] = index
    function claimNFT1155Token(
        address _originToken,
        address _toAddr,
        uint256 _id,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        string memory _uri
    ) external payable nonReentrant {
        require(
            _chainIdsIndex.length == 4 && chainId == _chainIdsIndex[2],
            "!chain id claim"
        );
        bytes32 _claimId = keccak256(
            abi.encode(
                _originToken,
                _toAddr,
                _id,
                _amount,
                _chainIdsIndex,
                _txHash,
                _uri
            )
        );
        require(!alreadyClaims[_claimId], "already claim");
        require(verifySignatures(r, s, v, _claimId), "invalid signatures");

        alreadyClaims[_claimId] = true;

        if (tokenMapList[_originToken].length == 0) {
            //claiming bridge token
            if (tokenMap[_chainIdsIndex[0]][_originToken] == address(0)) {
                //create bridge token
                DTOBridgeNFT1155 bt = new DTOBridgeNFT1155();
                bt.initialize(
                    _originToken,
                    _chainIdsIndex[0],
                    _uri
                );
                tokenMap[_chainIdsIndex[0]][_originToken] = address(bt);
                tokenMapReverse[address(bt)] = TokenInfo({
                addr: _originToken,
                chainId: _chainIdsIndex[0]
                });
                bridgeNFT1155Tokens[address(bt)] = true;
            }

            //claim
            _mintNFT1155ForUser(
                _id,
                _amount,
                _originToken,
                _chainIdsIndex,
                _txHash,
                _toAddr
            );
            emit ClaimNFT1155(
                _originToken,
                _toAddr,
                _id,
                _amount,
                _chainIdsIndex[0],
                _chainIdsIndex[1],
                chainId,
                _chainIdsIndex[3],
                _claimId
            );
        } else {
            //claiming original token

            IERC1155Upgradeable(_originToken).safeTransferFrom(address(this), _toAddr, _id, _amount, "");
            emit ClaimNFT1155(
                _originToken,
                _toAddr,
                _id,
                _amount,
                _chainIdsIndex[0],
                _chainIdsIndex[1],
                chainId,
                _chainIdsIndex[3],
                _claimId
            );
        }
    }

    function _mintNFT1155ForUser(
        uint256 _id,
        uint256 _amount,
        address _originToken,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        address _toAddr
    ) internal {
        IDTONFT1155Bridge(tokenMap[_chainIdsIndex[0]][_originToken])
        .claimBridgeToken(
            _originToken,
            _toAddr,
            _id,
            _amount,
            _chainIdsIndex,
            _txHash,
            ""
        );
    }

    function isBridgeToken(address _token) public view returns (bool) {
        if (bridgeNFT721Tokens[_token]) {
            return bridgeNFT721Tokens[_token];
        }
        return bridgeNFT1155Tokens[_token];
    }

    function getSupportedChainsForToken(address _token)
    external
    view
    returns (uint256[] memory)
    {
        return tokenMapList[_token];
    }

    function getBridgeApprovers() external view returns (address[] memory) {
        return bridgeApprovers;
    }

    /***********************************|
	|          Only Admin               |
	|      (blackhole prevention)       |
	|__________________________________*/
    // function withdrawEther(address payable receiver, uint256 amount)
    //     external
    //     virtual
    //     onlyGovernance
    // {
    //     _withdrawEther(receiver, amount);
    // }

    // function withdrawERC20(
    //     address payable receiver,
    //     address tokenAddress,
    //     uint256 amount
    // ) external virtual onlyGovernance {
    //     _withdrawERC20(receiver, tokenAddress, amount);
    // }

    // function withdrawERC721(
    //     address payable receiver,
    //     address tokenAddress,
    //     uint256 tokenId
    // ) external virtual onlyGovernance {
    //     _withdrawERC721(receiver, tokenAddress, tokenId);
    // }
}
