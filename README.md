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

 3. Tests
 `npm run test`

 ## How to interact with the bridge contracts using solidity
 ### Examples of how to call requestBridge and claimToken to make a bridge transaction from Ethereum to Casper
 
 ```solidity

interface IBridge {
    function requestBridge(
        address _tokenAddress,
        bytes memory _toAddr,
        uint256 _amount,
        uint256 _toChainId
    ) external payable;

    function claimToken(
        address _originToken,
        address _toAddr,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external payable;
}

contract ExternalExample {
    function bridgeToken(address erc20Token, uint amount, bytes memory toAddr) public {
        uint casperNetworkId = 131614895977472;
        IBridge bridge = IBridge(0x02b758ce469af940C57A42aD1dE5D404122bc283);
        IERC20 erc20TokenContract = IERC20(erc20Token);
        erc20TokenContract.transferFrom(msg.sender, address(this), amount);

        erc20TokenContract.approve(address(bridge), amount);
        bridge.requestBridge(erc20Token, toAddr, amount, casperNetworkId);
    }

    function claimToken(
        address _originToken,
        address _toAddr,
        uint256 _amount,
        uint256[] memory _chainIdsIndex,
        bytes32 _txHash,
        bytes32[] memory r,
        bytes32[] memory s,
        uint8[] memory v,
        string memory _name,
        string memory _symbol,
        uint8 _decimals) public {
        IBridge bridge = IBridge(0x02b758ce469af940C57A42aD1dE5D404122bc283);
        bridge.claimToken(
            _originToken, 
            _toAddr,
            _amount,
            _chainIdsIndex,
            _txHash,
            r,
            s,
            v,
            _name,
            _symbol,
            _decimals);
    }
}
 ```
