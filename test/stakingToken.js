const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber



describe('Staking Token', async function () {
    const [owner, ,user1, user2, user3, user4, user5, user6,user7,user8,user9,user10,user11,user12,user13] = await ethers.getSigners()
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
      let ERC20MockInstance = await ERC20Mock.deploy("test","tes",owner.address,20000000000)
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
       expect(await dto.balanceOf(dtoStaking.address)).to.be.equal(5000);

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
            dtoStaking.connect(user1).getUnlock(user1.address,0)
          ).to.be.revertedWith("Already withdrawn or not unlockable yet");

       await ethers.provider.send('evm_increaseTime', [1 *86400]); // 1 days
       await  dtoStaking.connect(user1).getUnlock(user1.address,0)
       expect(await dto.balanceOf(user1.address)).to.be.equal(5000)
    })

    it("notifyRewardAmount", async function (){
        await dto.connect(owner).transfer(user1.address,5000);
        await dto.connect(owner).transfer(user2.address,10000);

        await erc20Mock.connect(owner).transfer(dtoStaking.address,1000000000)
        await dto.connect(user1).approve(dtoStaking.address,5000);
        await dtoStaking.connect(user1).stake(5000);
        await dto.connect(user2).approve(dtoStaking.address,10000);
        await dtoStaking.connect(user2).stake(10000);
       
        await dtoStaking.notifyRewardAmount(1000000000);

        expect( await erc20Mock.balanceOf(user1.address)).to.be.equal(0);
        expect( await erc20Mock.balanceOf(dtoStaking.address)).to.be.equal(1000000000);

        await ethers.provider.send('evm_increaseTime', [7 *86400]); // 7 days
        await dtoStaking.connect(user1).getReward();
        await dtoStaking.connect(user2).getReward();

        const user1Balance = await erc20Mock.balanceOf(user1.address);
        const user2Balance = await erc20Mock.balanceOf(user2.address)
       expect(user2Balance ).to.be.equal(user1Balance *2);
    })
    it("stake, withdraw multip", async function (){
        const users = [ user4, user5, user6,user7,user8,user9,user10,user11,user12,user13];
        //stake
        for(var i = 0; i<users.length;i++){
            await dto.connect(owner).transfer(users[i].address,1000);
            await dto.connect(users[i]).approve(dtoStaking.address,1000);
            await dtoStaking.connect(users[i]).stake(1000);
            expect(await dtoStaking.balanceOf(users[i].address)).to.be.equal(1000)
        }
        expect(await dtoStaking.totalSupply()).to.be.equal(10000)
        expect(await dto.balanceOf(dtoStaking.address)).to.be.equal(10000);
        //withdraw
        for(var i = 0; i<users.length;i++){
            await dtoStaking.connect(users[i]).withdraw(500);
        expect(await dtoStaking.balanceOf(users[i].address)).to.be.equal(500)
        }
        expect(await dtoStaking.totalSupply()).to.be.equal(5000);
        expect(await dto.balanceOf(dtoStaking.address)).to.be.equal(5000);

        await ethers.provider.send('evm_increaseTime', [3 *86400]); // 3 days
        //getUnlock
        for(var i = 0; i<users.length;i++){ 
        await  dtoStaking.connect(users[i]).getUnlock(users[i].address,0)
        expect(await dto.balanceOf(users[i].address)).to.be.equal(500)
        }
          // getReward 
        await erc20Mock.connect(owner).transfer(dtoStaking.address,10000000000)
        await dtoStaking.notifyRewardAmount(10000000);
        for(var i = 0; i<users.length;i++){ 
            await dtoStaking.connect(users[i]).getReward();
            expect(await erc20Mock.balanceOf(users[i].address) ).to.above(0);
            //console.log((await erc20Mock.balanceOf(users[i].address)).toString())

        }
           //withdraw 
        for(var i = 0; i<users.length;i++){
            await dtoStaking.connect(users[i]).withdraw(500);
        expect(await dtoStaking.balanceOf(users[i].address)).to.be.equal(0)
        }
        expect(await dtoStaking.totalSupply()).to.be.equal(0);
        expect(await dto.balanceOf(dtoStaking.address)).to.be.equal(0);

       await ethers.provider.send('evm_increaseTime', [3 *86400]); // 3 days
        
       for(var i = 0; i<users.length;i++){ 
        await  dtoStaking.connect(users[i]).getUnlock(users[i].address,0)
        expect(await dto.balanceOf(users[i].address)).to.be.equal(1000)
        }
        // for(var i = 0; i<users.length;i++){ 
        //     await dtoStaking.connect(users[i]).getReward();
        //     expect(await erc20Mock.balanceOf(users[i].address) ).to.above(0);
        //     console.log(i,((await erc20Mock.balanceOf(users[i].address)).toString()))
        // }
    })
    it("upgrade contract", async function (){ 
        const DtoStaking = await ethers.getContractFactory('DTOStakingUpgrade')
        dtoStaking = await upgrades.upgradeProxy(dtoStaking.address,DtoStaking, [erc20Mock.address, dto.address, stakingTokenLock.address,0,0,7*86400,3*86400], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,
       await  dtoStaking.setNumbetTest(123)
       expect(await dtoStaking.getNumberTest()).to.be.equal(123);
    })

})