pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./TransferHelper.sol";

/**
 * @notice Prevents ETH or Tokens from getting stuck in a contract by allowing
 *  the Owner/DAO to pull them out on behalf of a user
 * This is only meant to contracts that are not expected to hold tokens, but do handle transferring them.
 */
contract BlackholePrevention {
  event WithdrawStuckEther(address indexed receiver, uint256 amount);
  event WithdrawStuckERC20(address indexed receiver, address indexed tokenAddress, uint256 amount);
  event WithdrawStuckERC721(address indexed receiver, address indexed tokenAddress, uint256 indexed tokenId);

  function _withdrawEther(address payable receiver, uint256 amount) internal {
    require(receiver != address(0x0), "BHP:E-403");
    if (address(this).balance >= amount) {
      TransferHelper.safeTransferETH(receiver, amount);
      emit WithdrawStuckEther(receiver, amount);
    }
  }

  function _withdrawERC20(address payable receiver, address tokenAddress, uint256 amount) internal {
    require(receiver != address(0x0), "BHP:E-403");
    if (IERC20(tokenAddress).balanceOf(address(this)) >= amount) {
      TransferHelper.safeTransfer(tokenAddress, receiver, amount);
      emit WithdrawStuckERC20(receiver, tokenAddress, amount);
    }
  }

  function _withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) internal {
    require(receiver != address(0x0), "BHP:E-403");
    if (IERC721(tokenAddress).ownerOf(tokenId) == address(this)) {
      IERC721(tokenAddress).transferFrom(address(this), receiver, tokenId);
      emit WithdrawStuckERC721(receiver, tokenAddress, tokenId);
    }
  }
}