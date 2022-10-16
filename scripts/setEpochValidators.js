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
const erc20Address = "0xFaAb233b75df55eF19aa69B060Ac06C9De8E4C0b"

async function requestBridge() {
	const { ethers, upgrades, getNamedAccounts } = hre;
    const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
    const network = await hre.network;

	const chainId = chainIdByName(network.name);

    log('  Using Network: ', chainNameById(chainId));

	const ValidatorSigner = await ethers.getContractFactory('ValidatorSigner');
	const ValidatorSignerInfo = require(`../deployments/${chainId}/ValidatorSigner.json`)
	const validatorSigner = await ValidatorSigner.attach(ValidatorSignerInfo.address)
  let signersForEpoch = await validatorSigner.getSignersForEpoch(1)
  console.log(signersForEpoch)
	//await validatorSigner.setSignersForEpoch(1, ["0x3cdc0b9a2383770c24ce335c07ddd5f09ee3e199", "0xc91b38d5bf1d2047529446cf575855e0744e9334", "0xdcaf39430997de9a96a088b31c902b4d10a55177"], 0)
}

requestBridge()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });