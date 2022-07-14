pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
interface IERC1155 is IERC1155Upgradeable {
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
}
