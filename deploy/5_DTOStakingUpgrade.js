const {
    chainNameById,
    chainIdByName,
    saveDeploymentData,
    getContractAbi,
    getTxGasCost,
    log
  } = require("../js-helpers/deploy");
  const { upgrades } = require('hardhat')

  const _ = require('lodash');

  module.exports = async (hre) => {
    const { ethers, upgrades, getNamedAccounts } = hre;
    const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
    const network = await hre.network;
    const deployData = {};

    const chainId = chainIdByName(network.name);
    //const alchemyTimeout = chainId === 31337 ? 0 : (chainId === 1 ? 5 : 3);
    const DTOAddress = require(`../deployments/${chainId}/DTO.json`).address
    const stakingTokenLockAddress = require(`../deployments/${chainId}/StakingTokenLock.json`).address

    const DTOStakingAddress = require(`../deployments/${chainId}/DTOStaking.json`).address

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    log('DTO Staking Contract Deployment');
    log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    log('  Using Network: ', chainNameById(chainId));
    log('  Using Accounts:');
    log('  - Deployer:          ', deployer);
    log('  - network id:          ', chainId);
    log('  - Owner:             ', protocolOwner);
    log('  - Trusted Forwarder: ', trustedForwarder);
    log(' ');
    
    log('  Deploying DTO  Staking Upgrade...');
    const DTOStaking = await ethers.getContractFactory('DTOStakingUpgrade');
    const dtoStaking = await upgrades.upgradeProxy(DTOStakingAddress,DTOStaking, ["0x09567080ec07d1b007108f2abe5b08d27299c286", DTOAddress, stakingTokenLockAddress,0,0,7*86400,3*86400], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
    log('  - DTOStaking:         ', dtoStaking.address);
    deployData['DTOStakingUpgrade'] = {
      abi: getContractAbi('DTOStakingUpgrade'),
      address: dtoStaking.address,
      deployTransaction: dtoStaking.deployTransaction,
    }
    
    saveDeploymentData(chainId, deployData);
    log('\n  Contract Deployment Data saved to "deployments" directory.');

    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['dtoStakingUpgrade']
