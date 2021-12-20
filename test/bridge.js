const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber
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


describe('Staking Token', async function () {
    const [owner, ,user1, user2, user3, user4, user5, user6,user7,user8,user9,user10,user11,user12,user13] = await ethers.getSigners()
    provider = ethers.provider;
    let dtoStaking,erc20Mock,stakingTokenLock,dto;
    beforeEach(async () => {
        const GenericBridge = await ethers.getContractFactory('GenericBridge');
        const genericBridge = await upgrades.deployProxy(GenericBridge, [], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
     
      await genericBridge.setSupportedChainIds(supportedChainIds, true)
      await genericBridge.addApprovers(approvers)
  
    })
    
    it("requestBridge" , async function (){
      

    })

})