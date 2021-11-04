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

module.exports = async (hre) => {
    const { ethers, upgrades, getNamedAccounts } = hre;
    const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
    const network = await hre.network;
    const deployData = {};

    const chainId = chainIdByName(network.name);
    const alchemyTimeout = chainId === 31337 ? 0 : (chainId === 1 ? 5 : 3);

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    log('DTO Multichain Bridge Oracle Protocol - Contract Deployment');
    log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    log('  Using Network: ', chainNameById(chainId));
    log('  Using Accounts:');
    log('  - Deployer:          ', deployer);
    log('  - network id:          ', chainId);
    log('  - Owner:             ', protocolOwner);
    log('  - Trusted Forwarder: ', trustedForwarder);
    log(' ');

    log('  Deploying DTOVesting...');
    let dtoAddress = "0xb57420fad6731b004309d5a0ec7c6c906adb8df7"
    let startVestingTime = 1638316800 //0:00:00 1/12/21 UTC+0

    if (chainId != 1) {
      dtoAddress = require(`../deployments/${chainId}/DTO.json`).address
      startVestingTime = Math.floor(Date.now() / 1000)
    }

    const DTOVesting = await ethers.getContractFactory('DTOVesting');
    const DTOVestingInstance = await DTOVesting.deploy()
    const dtoVesting = await DTOVestingInstance.deployed()
    log('  - DTOVesting:         ', dtoVesting.address);
    deployData['DTOVesting'] = {
      abi: getContractAbi('DTOVesting'),
      address: dtoVesting.address,
      deployTransaction: dtoVesting.deployTransaction,
    }

    log('  - Initializing         ');
    await dtoVesting.initialize(dtoAddress, startVestingTime)

    log('  - Adding vesting A         ');
    let privateSales = require(`./vesting/${chainId}.json`)
    let privateAAddresses = []
    let privateAAmounts = []
    for(const p of privateSales.privateA) {
      privateAAddresses.push(p.address)
      privateAAmounts.push(ethers.utils.parseEther(p.totalAmount))
    }
    await dtoVesting.addVesting(privateAAddresses, privateAAmounts, true)

    log('  - Adding vesting B         ');
    let privateBAddresses = []
    let privateBAmounts = []
    for(const p of privateSales.privateB) {
      console.log(p)
      privateBAddresses.push(p.address)
      privateBAmounts.push(ethers.utils.parseEther(p.totalAmount))
    }

    await dtoVesting.addVesting(privateBAddresses, privateBAmounts, false)

    saveDeploymentData(chainId, deployData);
    log('\n  Contract Deployment Data saved to "deployments" directory.');
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['dtovesting']
