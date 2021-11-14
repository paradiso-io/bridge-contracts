const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const BigNumber = ethers.BigNumber

describe('Vesting Token', async function () {
  const [
    owner,
    user1,
    user2,
    user3,
    user4,
    user5,
    user6,
    user7,
    user8,
    user9,
    user10,
    user11,
    user12,
    user13,
  ] = await ethers.getSigners()
  provider = ethers.provider
  let dtoVesting, dto
  beforeEach(async () => {
    //grab some mock token
    let ERC20Mock = await ethers.getContractFactory('ERC20Mock')
    let ERC20MockInstance = await ERC20Mock.deploy(
      'test',
      'tes',
      owner.address,
      ethers.utils.parseEther('100000000'),
    )
    dto = await ERC20MockInstance.deployed()

    const DTOVesting = await ethers.getContractFactory('DTOVesting')
    dtoVesting = await DTOVesting.deploy()
    dtoVesting = await dtoVesting.deployed()
    await dtoVesting.initialize(dto.address, 0)
  })

  async function timeShift(n) {
    await ethers.provider.send('evm_increaseTime', [n])
    await ethers.provider.send("evm_mine") 
  }

  it('Vesting', async function () {
    await dtoVesting.addVesting(
      [user1.address, user2.address],
      [ethers.utils.parseEther('150'), ethers.utils.parseEther('150')],
      true
    )
    await dtoVesting.addVesting(
      [user1.address, user3.address],
      [ethers.utils.parseEther('80'), ethers.utils.parseEther('80')],
      false
    )
    await dto
      .connect(owner)
      .transfer(dtoVesting.address, ethers.utils.parseEther('460'))
    await timeShift(86400 * 61 / 2)
    await dtoVesting.unlock(user1.address)
    await dtoVesting.unlock(user2.address)
    await dtoVesting.unlock(user3.address)

    expect(await dto.balanceOf(user1.address)).to.be.lt(ethers.utils.parseEther('21'))
    expect(await dto.balanceOf(user2.address)).to.be.lt(ethers.utils.parseEther('11'))
    expect(await dto.balanceOf(user3.address)).to.be.lt(ethers.utils.parseEther('11'))

    await timeShift(86400 * 61 / 2)
    await dtoVesting.unlock(user1.address)
    await dtoVesting.unlock(user2.address)
    await dtoVesting.unlock(user3.address)

    expect(await dto.balanceOf(user1.address)).to.be.lt(ethers.utils.parseEther('42'))
    expect(await dto.balanceOf(user2.address)).to.be.lt(ethers.utils.parseEther('21'))
    expect(await dto.balanceOf(user3.address)).to.be.lt(ethers.utils.parseEther('21'))

    await timeShift(7 * 86400 * 61 / 2)
    await dtoVesting.unlock(user1.address)
    await dtoVesting.unlock(user2.address)
    await dtoVesting.unlock(user3.address)

    expect(await dto.balanceOf(user1.address)).to.be.lt(ethers.utils.parseEther('189'))
    expect(await dto.balanceOf(user2.address)).to.be.lt(ethers.utils.parseEther('99'))
    expect(await dto.balanceOf(user3.address)).to.be.lt(ethers.utils.parseEther('99'))

    await timeShift(7 * 86400 * 61 / 2)
    await dtoVesting.unlock(user1.address)
    await dtoVesting.unlock(user2.address)
    await dtoVesting.unlock(user3.address)

    expect(await dto.balanceOf(user1.address)).to.be.eq(ethers.utils.parseEther('230'))
    expect(await dto.balanceOf(user2.address)).to.be.eq(ethers.utils.parseEther('150'))
    expect(await dto.balanceOf(user3.address)).to.be.eq(ethers.utils.parseEther('80'))

  })
})
