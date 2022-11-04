const hre = require("hardhat");
const assert = require("assert");
const testKey = require('../js-helpers/testkey')
const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
  log
} = require("../js-helpers/deploy");

const Web3 = require('web3')
const web3 = new Web3()

const call = require('../js-helpers/call')

async function requestBridge() {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
  const network = await hre.network;

  const chainId = chainIdByName(network.name);

  log('  Using Network: ', chainNameById(chainId));

  const ValidatorUpdate = await ethers.getContractFactory('ValidatorUpdate');
  const ValidatorUpdateInfo = require(`../deployments/${chainId}/ValidatorUpdate.json`)
  const validatorUpdate = await ValidatorUpdate.attach(ValidatorUpdateInfo.address)

  let initialValidatorsCount = 25;
  let startAt = Math.floor(Date.now() / 1000)
  let allSigs = []
  let allValidatorDatas = []
  let newValidatorHashes = []
  let allLastUpdatedAts = []
  for (var i = 0; i < 1; i++) {
    let testKeys = testKey.getTestKeys(i + initialValidatorsCount)

    let currentValidators = testKeys.addresses
    let validatorData = web3.eth.abi.encodeParameters(['address[]'], [currentValidators])
    let newTestKeys = testKey.getTestKeys(i + 1 + initialValidatorsCount)
    let newValidatorData = web3.eth.abi.encodeParameters(['address[]'], [newTestKeys.addresses])
    let newValidatorDataHash = web3.utils.sha3(newValidatorData)
    let lastUpdatedAt = startAt + i * 1000

    // creating signatures
    let data = web3.eth.abi.encodeParameters(["bytes32", "uint256"], [newValidatorDataHash, lastUpdatedAt])
    let msgHash = web3.utils.sha3(data);
    let sigs = []
    for(var j = 0; j < testKeys.keys.length; j++) {
      let sig = web3.eth.accounts.sign(msgHash, testKeys.keys[j]);
      sig = `${sig.r}${sig.s.replace("0x", "")}${sig.v.replace("0x", "")}`
      sigs.push(sig)
    }
    console.log("sigs", sigs)

    sigs = web3.eth.abi.encodeParameters(["bytes[]"], [sigs])
    allSigs.push(sigs)
    allValidatorDatas.push(validatorData)
    newValidatorHashes.push(newValidatorDataHash)
    allLastUpdatedAts.push(lastUpdatedAt)
    //let sig = web3.eth.accounts.sign(msgHash, signer);
    //let currentValidatorAddressesHash = 
  }
  console.log('data',allValidatorDatas, newValidatorHashes, allLastUpdatedAts, allSigs )
  const dataAndProof = web3.eth.abi.encodeParameters(
              ["bytes[]", "bytes32[]", "uint256[]", "bytes[]"], 
              [allValidatorDatas, newValidatorHashes, allLastUpdatedAts, allSigs])

  await validatorUpdate.updateValidatorsHash(dataAndProof)
  //console.log(signersForEpoch)
  //await validatorSigner.setSignersForEpoch(1, ["0x3cdc0b9a2383770c24ce335c07ddd5f09ee3e199", "0xc91b38d5bf1d2047529446cf575855e0744e9334", "0xdcaf39430997de9a96a088b31c902b4d10a55177"], 0)
}

requestBridge()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });