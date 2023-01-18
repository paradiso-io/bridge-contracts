# DotOracle smart contracts

This repository contains Solidity smart contracts of DotOracle.

All deployed contract addresses on different EVM chains can be found at https://github.com/dotoracle/bridge-contracts/tree/v1.0.0/deployments

## Install dependencies
`npm i`

## Compile the source code
1. Create .env file and fill corresponding information
```
PRIVATE_KEY=
INFURA_APIKEY=
BSC_APIKEY=
ETHERSCAN_APIKEY=
SNOWTRACE_APIKEY=
MOONSCAN_APIKEY=
PRIVATE_KEY_MAINNET=
MAINNET_ARCHIVE=

PRIVATE_KEY_NFTBRIDGE_TESTNET=
```
2. To compile the code
`npx hardhat compile`

## To deploy the bridge compilded contracts on any chain
`npx hardhat deploy --network <the network name in hardhat.config.js> --tags protocol`

## To upgraded the deployed contracts
 `npx hardhat deploy --network <the network name in hardhat.config.js> --tags protocolupgrade`
