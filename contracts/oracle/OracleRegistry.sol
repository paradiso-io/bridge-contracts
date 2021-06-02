pragma solidity ^0.7.0;

import "./IOracle.sol";
contract OracleRegistry {
	mapping(address => string[]) public externalUrls;

	modifier onlyValidOwner(address _oracle) {
		require(IOracle(_oracle).oracleOwner() == msg.sender, "invalid oracle owner");
		_;
	}
	function registerUrl(address _oracle, string memory _newUrl) public onlyValidOwner(_oracle) {
		externalUrls[_oracle].push(_newUrl);
	}

	function unregisterUrl(address _oracle, uint256 _index) public onlyValidOwner(_oracle) {
		require(externalUrls[_oracle].length > _index, "out of range");
		externalUrls[_oracle][_index] = externalUrls[_oracle][externalUrls[_oracle].length - 1];
		externalUrls[_oracle].pop();
	}
}