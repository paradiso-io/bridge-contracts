pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
interface IERC721 is IERC721Upgradeable {
    function mint(address to, uint256 tokenId) external;
}
