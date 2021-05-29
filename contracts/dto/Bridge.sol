pragma solidity ^0.7.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IClaim.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol"; // for WETH

contract Bridge is Ownable {
	address public bridgeApprover;
	uint256 public chainId;
    mapping(uint256 => bool) public supportedChainIds;
	address public tokenAddress;

	event RequestBridge(address indexed _addr, uint256 indexed _amount, uint256 _fromChainId, uint256 _toChainId);

	constructor(address _bridgeApprover, uint256 _chainId, address _tokenAddress) public {
        bridgeApprover = _bridgeApprover;
		chainId = _chainId;
		tokenAddress = _tokenAddress;
		supportedChainIds[_chainId] = true;
    }

	function setApprover(address _addr) public onlyOwner {
		bridgeApprover = _addr;
	}

	function setTokenAddress(address _addr) public onlyOwner {
		tokenAddress = _addr;
	}	

	function setSupportedChainId(uint256 _chainId, bool _val) public onlyOwner {
		supportedChainIds[_chainId] = _val;
	}

	function requestBridge(uint256 _amount, uint256 _toChainId) public {
		require(chainId != _toChainId, "source and target chain ids must be different");
		require(supportedChainIds[_toChainId], "unsupported chainId");
		IClaim(tokenAddress).burnForBridge(msg.sender, _amount);
		emit RequestBridge(msg.sender, _amount, chainId, _toChainId);
	}

	//@dev: _claimData: includex tx hash, event index, event data
	function claimToken(address _to, uint256 _amount, uint256 _chainId, bytes32 _claimData, bytes32 r, bytes32 s, uint8 v) external {
		bytes32 _claimId = keccak256(abi.encode(_to, _amount, _chainId, _claimData));
		require(ecrecover(keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _claimId)
        ), v, r, s) == bridgeApprover, "invalid signature");

		IClaim(tokenAddress).claimBridgeToken(_to, _amount, _chainId, uint256(_claimId));
	}
}