pragma solidity ^0.8.0;
import "../lib/DTOUpgradeableBase.sol";

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../interfaces/iStargateRouter.sol";

contract ParadisoRebalance is DTOUpgradeableBase, ReentrancyGuardUpgradeable, AccessControlUpgradeable {
    using AddressUpgradeable for address payable;
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address payable;

    address public stargateRouter;

    event Rebalance(address tokenAddress, uint256 dstChainId, address recipient, uint256 amount);

    function getSignatureSigner(bytes32 r, bytes32 s, uint8 v, bytes32 signedData) internal returns (address){
        return ecrecover(
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", signedData)),
            v, r, s
        );
    }

    function initialize() public initializer {
        __DTOUpgradeableBase_initialize();
    }

    function setStargateRouter(address _router) external onlyOwner {
        stargateRouter = _router;
    }

    function grantRole(bytes32 role, address account) public virtual override onlyOwner {
        require(bytes32("operator") == role || bytes32("validator") == role, "role does not exist");
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public virtual override onlyOwner {
        _revokeRole(role, account);
    }


    function estimateStargateFee(uint16 dstChainId, address recipient) public view returns (uint256, uint256) {
        iStargateRouter.lzTxObj memory _lzTxParams;
        _lzTxParams.dstGasForCall = 0;
        _lzTxParams.dstNativeAmount = 0;
        _lzTxParams.dstNativeAddr = abi.encodePacked(recipient);

        return iStargateRouter(stargateRouter).quoteLayerZeroFee(
            dstChainId, 1, abi.encodePacked(recipient), "0x", _lzTxParams);
    }


    function rebalance(
        address tokenAddress,
        address sender,
        address recipient,
        uint16 dstChainId,
        uint256 amount,
        // 0: srcPoolId, 1: dstPoolId, 2: deadline
        uint256[3] memory PoolIdAdnDeadline,
        bytes32[2] memory rs, uint8 v)
    public payable onlyRole(bytes32("operator")) {
        require(block.timestamp < PoolIdAdnDeadline[2], "request bridge expiry");
        require(hasRole(bytes32("validator"), getSignatureSigner(
            rs[0], rs[1], v, keccak256(abi.encode("bridge", tokenAddress, sender, dstChainId, amount, PoolIdAdnDeadline))
        )), "invalid sender signature");

        (uint256 nativeFee,) = estimateStargateFee(dstChainId, recipient);
        require(msg.value >= nativeFee, "stargate fee too low");

        IERC20Upgradeable(tokenAddress).transferFrom(sender, address(this), amount);
        if (IERC20Upgradeable(tokenAddress).allowance(address(this), stargateRouter) < amount) {
            IERC20Upgradeable(tokenAddress).approve(stargateRouter, type(uint256).max);
        }

        iStargateRouter.lzTxObj memory _lzTxParams;
        _lzTxParams.dstGasForCall = 0;
        _lzTxParams.dstNativeAmount = 0;
        _lzTxParams.dstNativeAddr = abi.encodePacked(recipient);

        iStargateRouter(stargateRouter).swap{value: nativeFee}(
            dstChainId,
            PoolIdAdnDeadline[0],
            PoolIdAdnDeadline[1],
            payable(recipient),
            amount,
            // min amount = 99%
            amount * 99 / 100,
            _lzTxParams,
            _lzTxParams.dstNativeAddr,
            "0x");

        emit Rebalance(tokenAddress, dstChainId, recipient, amount);
    }





}
