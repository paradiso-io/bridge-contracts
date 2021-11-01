pragma solidity ^0.8.0;

interface IOracle {
	function oracleOwner() external view returns (address);
}