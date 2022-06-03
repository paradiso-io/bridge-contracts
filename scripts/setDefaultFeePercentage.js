const hre = require("hardhat");
const assert = require("assert");
const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
  log
} = require("../js-helpers/deploy");

const call = require('../js-helpers/call')

async function requestBridge() {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
  const network = await hre.network;

  const chainId = chainIdByName(network.name);

  log('  Using Network: ', chainNameById(chainId));

  const GenericBridge = await ethers.getContractFactory('GenericBridge');
  const genericBridgeInfo = require(`../deployments/${chainId}/GenericBridge.json`)
  const genericBridgeContract = await GenericBridge.attach(genericBridgeInfo.address)

  await genericBridgeContract.setDefaultFeePercentage(10, {gasLimit: 1000000})
}

requestBridge()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });