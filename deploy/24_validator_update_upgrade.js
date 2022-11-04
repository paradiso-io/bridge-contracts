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

const testKey = require("../js-helpers/testkey")

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
  log('DTO Multichain ValidatorUpdate Upgrade Protocol - Contract Deployment');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log('  Using Network: ', chainNameById(chainId));
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - network id:          ', chainId);
  log('  - Owner:             ', protocolOwner);
  log('  - Trusted Forwarder: ', trustedForwarder);
  log(' ');

  log('  Deploying ValidatorSigner...');
  // let mainnet = false
  // if (chainId == 1 || chainId == 56 || chainId == 43114 || chainId) mainnet = true
  const ValidatorUpdateAddress =
    require(`../deployments/${chainId}/ValidatorUpdate.json`).address;
  const ValidatorUpdate = await ethers.getContractFactory('ValidatorUpdate');
  await upgrades.upgradeProxy(ValidatorUpdateAddress, ValidatorUpdate, {
    kind: "uups",
    gasLimit: 1000000,
  })

  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['validatorupdateupgrade']
