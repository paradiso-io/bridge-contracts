pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";

interface ICheck {
    function isERC1155(address nftAddress) external returns (bool);
    function isERC721(address nftAddress) external returns (bool);
}

contract CheckNftType {
    using ERC165CheckerUpgradeable for address;
    bytes4 public constant IID_ICHECK = type(ICheck).interfaceId;
    bytes4 public constant IID_IERC165 = type(IERC165Upgradeable).interfaceId;
    bytes4 public constant IID_IERC1155 = type(IERC1155Upgradeable).interfaceId;
    bytes4 public constant IID_IERC721 = type(IERC721Upgradeable).interfaceId;

    function isERC1155(address nftAddress) public view returns (bool) {
        return nftAddress.supportsInterface(IID_IERC1155);
    }

    function isERC721(address nftAddress) public view returns (bool) {
        return nftAddress.supportsInterface(IID_IERC721);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == IID_ICHECK || interfaceId == IID_IERC165;
    }

}