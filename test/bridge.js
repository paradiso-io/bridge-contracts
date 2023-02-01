const { inputToConfig } = require('@ethereum-waffle/compiler');
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
    supportedChainIds
  } = require("../js-helpers/deploy");

const chainID = 31337
describe('Generic Bridge', async function () {
    const [owner, user1, user2, user3, user4, user5, user6,user7,user8,user9,user10, v0, v1, v2] = await ethers.getSigners()
    let provider = ethers.provider;
    let genericBridge;
    let erc20Mock
    beforeEach(async () => {
      const GenericBridge = await ethers.getContractFactory('GenericBridge');
      genericBridge = await upgrades.deployProxy(GenericBridge, [[1]], { unsafeAllow: ['delegatecall'],unsafeAllowCustomTypes: true, kind: 'uups', gasLimit: 1000000 })
      
      await genericBridge.addApprovers([v0.address, v1.address, v2.address])

      let ERC20Mock = await ethers.getContractFactory("ERC20Mock")
      let ERC20MockInstance = await ERC20Mock.deploy("test","tes",owner.address, 20000000000)
      erc20Mock = await ERC20MockInstance.deployed()
    })
    
    describe("requestBridge" , async function (){
      it("should throw an error if source and target chain ids are the same", async () => {
        await expect(genericBridge.connect(owner).requestBridge(erc20Mock.address, user1.address, 10, provider.network.chainId)).to.be.revertedWith('source and target chain ids must be different')
      })
      it("should throw an error if unsupported chainId is passed", async () => {
        await expect(genericBridge.connect(owner).requestBridge(erc20Mock.address, user1.address, 10, 12)).to.be.revertedWith('unsupported chainId')
      })
      it("should emit RequestBridge event with correct parameters", async () => {
        erc20Mock.connect(owner).approve(genericBridge.address, 1000000)
        expect(await genericBridge.connect(owner).requestBridge(erc20Mock.address, ethers.utils.solidityPack(['address'], [user1.address]), 1000, 1))
                    .to.emit(genericBridge, "RequestBridge")
                    .withArgs(erc20Mock.address, ethers.utils.solidityPack(['address'], [user1.address]), 999, 31337, 31337, 1, 0)
      })
    })

    describe("claimToken" , async function (){
      it("ChainIds input invalid", async () => {
        await expect(genericBridge.connect(owner).claimToken(erc20Mock.address, user1.address, 100, [10, 11, 12], "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", [], [], [], "", "", 18)).to.be.revertedWith('!chain id claim')
        await expect(genericBridge.connect(owner).claimToken(erc20Mock.address, user1.address, 100, [10, 11, 12, 13], "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", [], [], [], "", "", 18)).to.be.revertedWith('!chain id claim')
      })

      it("Claim success", async () => {
        const signature1 = v0.signMessage()
        await expect(genericBridge.connect(owner).claimToken(erc20Mock.address, user1.address, 100, [10, 11, 12], "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", [], [], [], "", "", 18)).to.be.revertedWith('!chain id claim')
      })
    })

})