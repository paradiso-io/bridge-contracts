


pragma solidity ^0.7.0;
import "../lib/DotOracleLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract OracleContract is Ownable {

	function oracleAdmin() public view returns (address) {
		return owner();
	}

	function readOffChainData(string memory _url) internal returns (bytes memory) {
		return DotOracleLib.fetchOffChainData(_url);
	}
}