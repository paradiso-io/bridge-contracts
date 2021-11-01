const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber
const DTOABI = require('../abi/DTO.json')



describe('Staking Token', async function () {
    const [owner, locker,user1, user2, user3, user4, user5, user6] = await ethers.getSigners()
    provider = ethers.provider;
    let dtoStaking,erc20Mock,stakingTokenLock;
    beforeEach(async () => {
      const StakingTokenLock = await ethers.getContractFactory("StakingTokenLock")
      let StakingTokenLockInstance = await StakingTokenLock.deploy()
      stakingTokenLock = await StakingTokenLockInstance.deployed()
      await stakingTokenLock.initialize(locker.address)
        //dto token
        let DTO = await ethers.getContractFactory("DTO")
        let DTOInstance  = await DTO.deploy()
        dto = await DTOInstance.deployed()
      //grab some mock token
      let ERC20Mock = await ethers.getContractFactory("ERC20Mock")
      let ERC20MockInstance = await ERC20Mock.deploy()
      erc20Mock = await ERC20MockInstance.deployed()
  
      const DtoStaking = await ethers.getContractFactory('DTOStaking')
      dtoStaking = await upgrades.deployProxy(DtoStaking, [erc20Mock.address, dto.address, stakingTokenLock.address], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,
      expect(await dtoStaking.balanceOf(owner.address)).to.be.equal(ethers.utils.parseEther('0'))
  
    })
    
    it("stake" , async function (){
        dto.transfer(user1.address,100000);
        dtoStaking.connect(user1).stake(5000);
        expect(await dtoStaking.totalSupply()).to.be.equal(5000)
    })

})