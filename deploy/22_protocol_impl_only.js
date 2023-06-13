const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  log} = require("../js-helpers/deploy");


module.exports = async (hre) => {
  const { ethers, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const network = await hre.network;
  const deployData = {};

  const chainId = chainIdByName(network.name);
  if (chainId === 31337) return

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('DTO Multichain Bridge Protocol - Contract Deployment');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log('  Using Network: ', chainNameById(chainId));
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - network id:          ', chainId);
  log(' ');

  log('  Deploying GenericBridge...');
  const GenericBridge = await ethers.getContractFactory('GenericBridge');
  let genericBridge = await GenericBridge.deploy()
  genericBridge = await genericBridge.deployed()

  log('  - GenericBridgeImpl:         ', genericBridge.address);
  deployData['GenericBridgeImpl'] = {
    abi: getContractAbi('GenericBridge'),
    address: genericBridge.address,
    deployTransaction: genericBridge.deployTransaction
  }

  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['protocol_impl_only']
