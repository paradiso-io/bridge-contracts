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
  log('DTO Multichain Bridge Protocol 2 - Contract Deployment');
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
  console.log('supportedChainIds(chainId)', supportedChainIds(false))
  const GenericBridge2 = await ethers.getContractFactory('GenericBridge2');
  const genericBridge2 = await upgrades.deployProxy(GenericBridge2, [supportedChainIds(false)], { kind: 'uups', gasLimit: 8000000 })

  log('  - GenericBridge2:         ', genericBridge2.address);
  deployData['GenericBridge2'] = {
    abi: getContractAbi('GenericBridge2'),
    address: genericBridge2.address,
    deployTransaction: genericBridge2.deployTransaction,
  }
  // await sleep(20000)
  // await genericBridge2.addApprovers(approvers)
  // await genericBridge2.setFeeReceiver("0x3b9cAeA186DbEFa01ef4e922e38d4a32dE2d51af")

  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['genericbridge2']
