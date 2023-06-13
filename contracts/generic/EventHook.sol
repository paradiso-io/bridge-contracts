pragma solidity 0.8.3;
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IEventHook.sol";
contract EventHook is Ownable, IEventHook {
    mapping(address => bool) public isNEVMWrapToken;

    modifier onlyNEVMWrap() {
        require(isNEVMWrapToken[msg.sender], "not wrap non evm token contract");
        _;
    }

    function setNEVMWrapToken(address _token, bool _val) external onlyOwner {
        isNEVMWrapToken[_token] = _val;
    }

    function postRequestBridge(
        bytes memory _token,
        bytes memory _toAddr,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index
    ) external override onlyNEVMWrap {
        emit RequestBridge(_token, _toAddr, _amount, _originChainId, _fromChainId, _toChainId, _index);
    }

    function postClaimToken(
        bytes memory _token,
        address _toAddr,
        uint256 _amount,
        uint256 _originChainId,
        uint256 _fromChainId,
        uint256 _toChainId,
        uint256 _index,
        bytes32 _claimId
    ) external override onlyNEVMWrap {
        emit ClaimToken(_token, _toAddr, _amount, _originChainId, _fromChainId, _toChainId, _index, _claimId);
    }
}
