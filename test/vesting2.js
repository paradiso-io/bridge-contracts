const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber

describe('Vesting Token', async function () {
  // const [
  //   owner,
  //   user1,
  //   user2,
  //   user3,
  //   user4,
  //   user5,
  //   user6,
  //   user7,
  //   user8,
  //   user9,
  //   user10,
  //   user11,
  //   user12,
  //   user13,
  // ] = await ethers.getSigners()
  // provider = ethers.provider
  // let anAddress = '0x122011206098fAcBa7e24F57412402E9b497D519'
  // let another = '0x551106Af1bDA112F046e405d50197272Dfc5f0aa'
  // let dtoVesting, dto
  // beforeEach(async () => {
  //   //grab some mock token
  //   let ERC20Mock = await ethers.getContractFactory('ERC20Mock')
  //   dto = await ERC20Mock.attach('0xb57420fad6731b004309d5a0ec7c6c906adb8df7')

  //   const DTOVesting = await ethers.getContractFactory('DTOVesting2')
  //   dtoVesting = await upgrades.deployProxy(DTOVesting, [], {
  //     unsafeAllow: ['delegatecall'],
  //     kind: 'uups',
  //     gasLimit: 1000000,
  //   })
  // })

  // async function timeShift(n) {
  //   await ethers.provider.send('evm_increaseTime', [n])
  //   await ethers.provider.send('evm_mine')
  // }

  // it('Vesting2', async function () {
  //   let lockedInfo = await dtoVesting.getLockedInfo(anAddress)
  //   console.log(
  //     ethers.utils.formatEther(lockedInfo._locked),
  //     ethers.utils.formatEther(lockedInfo._releasable),
  //   )

  //   lockedInfo = await dtoVesting.getLockedInfo(another)
  //   console.log(
  //     ethers.utils.formatEther(lockedInfo._locked),
  //     ethers.utils.formatEther(lockedInfo._releasable),
  //   )
  // })
})
