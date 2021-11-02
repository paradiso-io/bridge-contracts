const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber



describe('Staking Token', async function () {
    const [owner, locker,user1, user2, user3, user4, user5, user6] = await ethers.getSigners()
    provider = ethers.provider;
    let dtoStaking,erc20Mock,stakingTokenLock,dto;
    beforeEach(async () => {
      const StakingTokenLock = await ethers.getContractFactory("StakingTokenLock")
      let StakingTokenLockInstance = await StakingTokenLock.deploy()
      stakingTokenLock = await StakingTokenLockInstance.deployed()
        //dto token
        let DTO = await ethers.getContractFactory("DTO")
        let DTOInstance  = await DTO.deploy()
        dto = await DTOInstance.deployed()
      //grab some mock token
      let ERC20Mock = await ethers.getContractFactory("ERC20Mock")
      let ERC20MockInstance = await ERC20Mock.deploy("test","tes",owner.address,100000000000000)
      erc20Mock = await ERC20MockInstance.deployed()
  
      const DtoStaking = await ethers.getContractFactory('DTOStaking')
      dtoStaking = await upgrades.deployProxy(DtoStaking, [erc20Mock.address, dto.address, stakingTokenLock.address,0,0,7*86400,3*86400], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,
      expect(await dtoStaking.balanceOf(dtoStaking.address)).to.be.equal(ethers.utils.parseEther('0'))
      await stakingTokenLock.initialize(dtoStaking.address)

    })
    
    it("stake" , async function (){
       await dto.connect(owner).transfer(user1.address,100000);
       await dto.connect(user1).approve(dtoStaking.address,100000);
       await dtoStaking.connect(user1).stake(5000);
       expect(await dtoStaking.totalSupply()).to.be.equal(5000)
       expect(await dtoStaking.balanceOf(user1.address)).to.be.equal(5000)
       expect(await dto.balanceOf(dtoStaking.address)).to.be.equal(5000)
    })
    it("withdraw" , async function (){
        await dto.connect(owner).transfer(user1.address,5000);
        await dto.connect(user1).approve(dtoStaking.address,5000);
        await dtoStaking.connect(user1).stake(5000);
        await expect(
            dtoStaking.connect(user1).withdraw(0)
          ).to.be.revertedWith("Cannot withdraw 0");
        await dtoStaking.connect(user1).withdraw(5000) ;
        expect(await dtoStaking.totalSupply()).to.be.equal(0);
        expect(await dtoStaking.balanceOf(user1.address)).to.be.equal(0)
        expect(await dto.balanceOf(dtoStaking.address)).to.be.equal(0);

        expect(await dto.balanceOf(stakingTokenLock.address)).to.be.equal(5000);
        
        await ethers.provider.send('evm_increaseTime', [2 *86400]); // 2 days
        await expect(
            stakingTokenLock.connect(user1).unlock(user1.address,0)
          ).to.be.revertedWith("Already withdrawn or not unlockable yet");

       await ethers.provider.send('evm_increaseTime', [2 *86400]); // 1 days
       await  stakingTokenLock.connect(user1).unlock(user1.address,0)
       expect(await dto.balanceOf(user1.address)).to.be.equal(5000)
    })
})