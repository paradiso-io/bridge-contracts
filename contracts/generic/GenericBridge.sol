pragma solidity ^0.7.0;
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol"; // for WETH
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // for WETH
import "../lib/BlackholePrevention.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // for WETH
import "./DTOBridgeToken.sol";
import "./IDTOTokenBridge.sol";
import "./Governable.sol";

contract GenericBridge is Ownable, ReentrancyGuard, BlackholePrevention, Governable {
	using SafeMath for uint256;
	using SafeERC20 for IERC20;

	mapping(bytes32 => bool) public alreadyClaims;
	address[] public bridgeApprovers;
	mapping(address => bool) public approverMap; 	//easily check approver signature
	uint256 public chainId;
    mapping(uint256 => bool) public supportedChainIds;
	mapping(address => uint256[]) public tokenMapList;	//to which chain ids this token is bridged to
	mapping(address => mapping(uint256 => bool)) public tokenMapSupportCheck;	//to which chain ids this token is bridged to
	mapping(address => address) public tokenMap;
	mapping(address => address) public tokenMapReverse;	//mapping from bridge token to address of the original token
	mapping(address => bool) public bridgeTokens;	//mapping of bridge tokens on this chain
	address[] public originTokenList;
	uint256 public feex10000;	//1 => 0.01%

	uint256 public index;
	uint256 public minApprovers;

	//_token is the origin token, regardless it's bridging from or to the origini token 
	event RequestBridge(address indexed _token, address indexed _addr, uint256 _amount, uint256 _fromChainId, uint256 _toChainId, uint256 _index);

	constructor(address[] memory _bridgeApprovers, uint256 _chainId) public {
        bridgeApprovers = _bridgeApprovers;
		chainId = _chainId;
		supportedChainIds[_chainId] = true;
		minApprovers = 2;
		for(uint256 i = 0; i < bridgeApprovers.length; i++) {
			approverMap[bridgeApprovers[i]] = true;
		}
		feex10000 = 0;
		governance = owner();
    }

	function setMinApprovers(uint256 _val) public onlyGovernance {
		require(_val >= 2, "!min set approver");
		minApprovers = _val;
	}

	function addApprover(address _addr) public onlyGovernance {
		require(!approverMap[_addr], "already approver");
		require(_addr != address(0), "non zero address");
		for(uint256 i = 0; i < bridgeApprovers.length; i++) {
			if (bridgeApprovers[i] == _addr) return;
		}
		bridgeApprovers.push(_addr);
		approverMap[_addr] = true;
	}

	function removeApprover(address _addr) public onlyGovernance {
		require(approverMap[_addr], "not approver");
		for(uint256 i = 0; i < bridgeApprovers.length; i++) {
			if (bridgeApprovers[i] == _addr) {
				bridgeApprovers[i] = bridgeApprovers[bridgeApprovers.length - 1];
				bridgeApprovers.pop();
				approverMap[_addr] = false;
				return;
			}
		}
	}

	function setSupportedChainId(uint256 _chainId, bool _val) public onlyGovernance {
		supportedChainIds[_chainId] = _val;
	}

	function setGovernanceFee(uint256 _feeX10000) public onlyGovernance {
		feex10000 = _feeX10000;
	}

	function requestBridge(address _tokenAddress, uint256 _amount, uint256 _toChainId) public {
		require(chainId != _toChainId, "source and target chain ids must be different");
		require(supportedChainIds[_toChainId], "unsupported chainId");
		if (!isBridgeToken(_tokenAddress)) {
			//transfer and lock token here
			safeTransferIn(_tokenAddress, msg.sender, _amount);
			emit RequestBridge(_tokenAddress, msg.sender, _amount, chainId, _toChainId, index);
			index++;

			if (tokenMapList[_tokenAddress].length == 0) {
				originTokenList.push(_tokenAddress);
			}

			if (!tokenMapSupportCheck[_tokenAddress][_toChainId]) {
				tokenMapList[_tokenAddress].push(_toChainId);
				tokenMapSupportCheck[_tokenAddress][_toChainId] = true;
			}
		} else {
			ERC20Burnable(_tokenAddress).burnFrom(msg.sender, _amount);
			address _originToken = tokenMapReverse[_tokenAddress];
			emit RequestBridge(_originToken, msg.sender, _amount, chainId, _toChainId, index);
			index++;
		}
	}

	function verifySignatures(bytes32[] memory r, bytes32[] memory s, uint8[] memory v, bytes32 signedData) internal view returns (bool) {
		require(minApprovers >= 2, "!min approvers");
		require(bridgeApprovers.length >= minApprovers, "!min approvers");
		uint256 successSigner = 0;
		if (r.length == s.length && s.length == v.length && v.length >= minApprovers) {
			for(uint256 i = 0; i < r.length; i++) {
				address signer = ecrecover(keccak256(
					abi.encodePacked("\x19Ethereum Signed Message:\n32", signedData)
				), v[i], r[i], s[i]);
				if (approverMap[signer]) {
					successSigner++;
				}
			}
		}

		return successSigner >= minApprovers;
	}

	//@dev: _claimData: includex tx hash, event index, event data
	//@dev _tokenInfos: contain token name and symbol of bridge token
	//_chainIdsIndex: length = 3, _chainIdsIndex[0] => fromChainId, _chainIdsIndex[1] = toChainId = this chainId, _chainIdsIndex[2] = index
	function claimToken(address _originToken, address _to, uint256 _amount, uint256[] memory _chainIdsIndex, bytes32 _txHash,  bytes32[] memory r, bytes32[] memory s, uint8[] memory v, string memory _name, string memory _symbol, uint8 _decimals) external nonReentrant {
		require(_chainIdsIndex.length == 3 && chainId != _chainIdsIndex[1], "!chain id claim");
		bytes32 _claimId = keccak256(abi.encode(_originToken, _to, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals));
		require(!alreadyClaims[_claimId], "already claim");
		require(verifySignatures(r, s, v, _claimId), "invalid signatures");

		alreadyClaims[_claimId] = true;
		if (tokenMapList[_originToken].length == 0) {
			//claiming on bridge token
			if (tokenMap[_originToken] == address(0)) {
				//create bridge token
				DTOBridgeToken bt = new DTOBridgeToken(_originToken, _chainIdsIndex[1], _name, _symbol, _decimals);
				tokenMap[_originToken] = address(bt);
				tokenMapReverse[address(bt)] = _originToken;
			}
			//claim
			IDTOTokenBridge(tokenMap[_originToken]).claimBridgeToken(_originToken, _to, _amount, _chainIdsIndex, _txHash);
			safeTransferOut(tokenMap[_originToken], _to, computeTransferAmount(_amount));
			safeTransferOut(tokenMap[_originToken], governance, computeFeeAmount(_amount));
		} else {
			//claiming original token
			safeTransferOut(_originToken, _to, computeTransferAmount(_amount));
			safeTransferOut(_originToken, governance, computeFeeAmount(_amount));
		}
	}

	function computeTransferAmount(uint256 _amount) internal view returns (uint256) {
		return _amount.sub(_amount.mul(feex10000).div(10000));
	}

	function computeFeeAmount(uint256 _amount) internal view returns (uint256) {
		return _amount.mul(feex10000).div(10000);
	}

	/***********************************|
	|          Only Admin               |
	|      (blackhole prevention)       |
	|__________________________________*/
	function withdrawEther(address payable receiver, uint256 amount) external virtual onlyGovernance {
    	_withdrawEther(receiver, amount);
	}

	function withdrawERC20(address payable receiver, address tokenAddress, uint256 amount) external virtual onlyGovernance {
		_withdrawERC20(receiver, tokenAddress, amount);
	}

	function withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) external virtual onlyGovernance {
		_withdrawERC721(receiver, tokenAddress, tokenId);
	}

	function isBridgeToken(address _token) public view returns (bool) {
		return bridgeTokens[_token];
	}

	function safeTransferIn(address _token, address _from, uint256 _amount) internal nonReentrant {
		IERC20 erc20 = IERC20(_token);
		uint256 balBefore = erc20.balanceOf(address(this));
		erc20.safeTransferFrom(_from, address(this), _amount);
		require(erc20.balanceOf(address(this)).sub(balBefore) == _amount, "!transfer from");
	}

	function safeTransferOut(address _token, address _to, uint256 _amount) internal nonReentrant {
		IERC20 erc20 = IERC20(_token);
		uint256 balBefore = erc20.balanceOf(address(this));
		erc20.safeTransfer(_to, _amount);
		require(balBefore.sub(erc20.balanceOf(address(this))) == _amount, "!transfer to");
	}

	//migrate to a new contract
	function migrateOwnership(address _token, address _newOwner) public onlyGovernance {
		Ownable(_token).transferOwnership(_newOwner);
	}
}