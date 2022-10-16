const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
  log,
  supportedChainIds,
  approvers
} = require("../js-helpers/deploy");

const _ = require('lodash');
let sleep = async (time) => new Promise((resolve) => setTimeout(resolve, time))

module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
  const network = await hre.network;
  const deployData = {};

  const chainId = chainIdByName(network.name);
  const alchemyTimeout = chainId === 31337 ? 0 : (chainId === 1 ? 5 : 3);

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('DTO Multichain GatewayWithValidator - Contract Deployment');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log('  Using Network: ', chainNameById(chainId));
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - network id:          ', chainId);
  log('  - Owner:             ', protocolOwner);
  log('  - Trusted Forwarder: ', trustedForwarder);
  log(' ');

  log('  Deploying GenericBridge2...');
  // let mainnet = false
  // if (chainId == 1 || chainId == 56 || chainId == 43114 || chainId) mainnet = true
  const GenericBridge2Address =
    require(`../deployments/${chainId}/GenericBridge2.json`).address;
  const GatewayWithValidator = await ethers.getContractFactory('GatewayWithValidator');
  const gateway = await upgrades.deployProxy(GatewayWithValidator, [GenericBridge2Address], { kind: 'uups', gasLimit: 8000000 })

  log('  - GatewayWithValidator:         ', gateway.address);
  deployData['GatewayWithValidator'] = {
    abi: getContractAbi('GatewayWithValidator'),
    address: gateway.address,
    deployTransaction: gateway.deployTransaction,
  }

  const GenericBridge2 = await ethers.getContractFactory('GenericBridge2');
  const bridge = await GenericBridge2.attach(GenericBridge2Address)
  await bridge.setGatewayContract(gateway.address)

  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['gateway']
