pragma solidity ^0.7.0;

interface IOracle {
	function oracleOwner() external view returns (address);
}