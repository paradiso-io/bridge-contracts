pragma solidity 0.5.17;

interface IOracle {
	function oracleOwner() external view returns (address);
}