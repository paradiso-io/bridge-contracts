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
const erc20Address = "0x20aaDa979814b9Ff3E5DF1999871a7244Bf71BFE"

async function requestBridge() {
	const { ethers, upgrades, getNamedAccounts } = hre;
    const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
    const network = await hre.network;

	const chainId = chainIdByName(network.name);

  log('  Using Network: ', chainNameById(chainId));

	const IERC20 = await ethers.getContractAt('IERC20');
	let token = await IERC20.attach(erc20Address)

	const networkName = chainNameById(chainId).toLowerCase()
	const GenericBridge = await ethers.getContractFactory('GenericBridge');
	const genericBridgeInfo = require(`../deployments/${chainId}/GenericBridge.json`)
	const genericBridgeContract = await GenericBridge.attach(genericBridgeInfo.address)

	await call(token, "approve", [genericBridgeInfo.address, 100000e18])
}

requestBridge()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });