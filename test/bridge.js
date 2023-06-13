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
    const [owner, user1, user2, user3, user4, user5, user6,user7,user8,user9, feeReceiver, v0, v1, v2] = await ethers.getSigners()
    let provider = ethers.provider;
    let genericBridge;
    let erc20Mock
    let DTOBridgeToken
    beforeEach(async () => {
      DTOBridgeToken = await ethers.getContractFactory('DTOBridgeToken') 
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

      it("should emit RequestBridge event with correct parameters even with fee receiver changed", async () => {
        console.log('fee receiver', (await genericBridge.feeReceiver()))
        await genericBridge.setFeeReceiver(feeReceiver.address)
        await erc20Mock.connect(owner).approve(genericBridge.address, 1000000)
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
        const [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals] = [
              "0x1234567812345678123456781234567812345678",
              user1.address,
              1000,
              [1, 1, 31337, 1],
              "0x1234567812345678123456781234567812345678123456781234567812345678",
              "test",
              "test",
              18
        ]

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256[]', 'bytes32', 'string', 'string', 'uint8'],
          [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals]
        )
        
        const _claimId = ethers.utils.arrayify(ethers.utils.keccak256(encoded)) 
        const signature1 = ethers.utils.splitSignature(await v0.signMessage(_claimId))
        const signature2 = ethers.utils.splitSignature(await v1.signMessage(_claimId))
        const signature3 = ethers.utils.splitSignature(await v2.signMessage(_claimId))
        
        // cant claim without enough sig
        await expect(genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r], [signature1.s], [signature1.v], 
          _name, 
          _symbol,
          _decimals)).to.be.revertedWith('invalid signatures')

        expect(await genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.emit(genericBridge, 'ClaimToken')
                        .withArgs(_originToken, _toAddr, _amount, _chainIdsIndex[0], _chainIdsIndex[1], chainID, _chainIdsIndex[3], '0x' + Buffer.from(_claimId).toString('hex'))

        // cant double claim
        await expect(genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.be.revertedWith('already claim')
      })

      it("Claim success for bridged native token", async () => {
        const [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals] = [
              "0x1111111111111111111111111111111111111111",
              user1.address,
              1000,
              [1, 1, 31337, 1],
              "0x1234567812345678123456781234567812345678123456781234567812345678",
              "test",
              "test",
              18
        ]

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256[]', 'bytes32', 'string', 'string', 'uint8'],
          [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals]
        )
        
        const _claimId = ethers.utils.arrayify(ethers.utils.keccak256(encoded)) 
        const signature1 = ethers.utils.splitSignature(await v0.signMessage(_claimId))
        const signature2 = ethers.utils.splitSignature(await v1.signMessage(_claimId))
        const signature3 = ethers.utils.splitSignature(await v2.signMessage(_claimId))
        
        // cant claim without enough sig
        await expect(genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r], [signature1.s], [signature1.v], 
          _name, 
          _symbol,
          _decimals)).to.be.revertedWith('invalid signatures')

        expect(await genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.emit(genericBridge, 'ClaimToken')
                        .withArgs(_originToken, _toAddr, _amount, _chainIdsIndex[0], _chainIdsIndex[1], chainID, _chainIdsIndex[3], '0x' + Buffer.from(_claimId).toString('hex'))

        // cant double claim
        await expect(genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.be.revertedWith('already claim')
      })

      it("Claim success and request back", async () => {
        const [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals] = [
              "0x1234567812345678123456781234567812345678",
              user1.address,
              1000,
              [1, 1, 31337, 1],
              "0x1234567812345678123456781234567812345678123456781234567812345678",
              "test",
              "test",
              18
        ]

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256[]', 'bytes32', 'string', 'string', 'uint8'],
          [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals]
        )
        
        const _claimId = ethers.utils.arrayify(ethers.utils.keccak256(encoded)) 
        const signature1 = ethers.utils.splitSignature(await v0.signMessage(_claimId))
        const signature2 = ethers.utils.splitSignature(await v1.signMessage(_claimId))
        const signature3 = ethers.utils.splitSignature(await v2.signMessage(_claimId))

        expect(await genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.emit(genericBridge, 'ClaimToken')
                        .withArgs(_originToken, _toAddr, _amount, _chainIdsIndex[0], _chainIdsIndex[1], chainID, _chainIdsIndex[3], '0x' + Buffer.from(_claimId).toString('hex'))
        
        const bridgedTokenAddress = await genericBridge.tokenMap(_chainIdsIndex[0], _originToken)
        const bridgedTokenContract = await DTOBridgeToken.attach(bridgedTokenAddress)
        await bridgedTokenContract.connect(user1).approve(genericBridge.address, 1000000)

        expect(await genericBridge.connect(user1).requestBridge(bridgedTokenContract.address, ethers.utils.solidityPack(['address'], [user1.address]), 999, 1))
                    .to.emit(genericBridge, "RequestBridge")
                    .withArgs(_originToken, ethers.utils.solidityPack(['address'], [user1.address]), 999, 1, 31337, 1, 0)
      })

      it ("defaultFeePercentage could be changed", async () => {
        await genericBridge.setDefaultFeePercentage(20)
        expect(await genericBridge.defaultFeePercentage()).to.be.eq(20)
      })

      it("Claim success and request back for bridged native token", async () => {
        const [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals] = [
              "0x1111111111111111111111111111111111111111",
              user1.address,
              1000,
              [1, 1, 31337, 1],
              "0x1234567812345678123456781234567812345678123456781234567812345678",
              "test",
              "test",
              18
        ]

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256[]', 'bytes32', 'string', 'string', 'uint8'],
          [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals]
        )
        
        const _claimId = ethers.utils.arrayify(ethers.utils.keccak256(encoded)) 
        const signature1 = ethers.utils.splitSignature(await v0.signMessage(_claimId))
        const signature2 = ethers.utils.splitSignature(await v1.signMessage(_claimId))
        const signature3 = ethers.utils.splitSignature(await v2.signMessage(_claimId))

        expect(await genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.emit(genericBridge, 'ClaimToken')
                        .withArgs(_originToken, _toAddr, _amount, _chainIdsIndex[0], _chainIdsIndex[1], chainID, _chainIdsIndex[3], '0x' + Buffer.from(_claimId).toString('hex'))
        
        const bridgedTokenAddress = await genericBridge.tokenMap(_chainIdsIndex[0], _originToken)
        const bridgedTokenContract = await DTOBridgeToken.attach(bridgedTokenAddress)
        await bridgedTokenContract.connect(user1).approve(genericBridge.address, 1000000)

        expect(await genericBridge.connect(user1).requestBridge(bridgedTokenContract.address, ethers.utils.solidityPack(['address'], [user1.address]), 999, 1))
                    .to.emit(genericBridge, "RequestBridge")
                    .withArgs(_originToken, ethers.utils.solidityPack(['address'], [user1.address]), 999, 1, 31337, 1, 0)
      })

      it("Claim origin token", async () => {
        const [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals] = [
              erc20Mock.address,
              user1.address,
              1000,
              [31337, 1, 31337, 1],
              "0x1234567812345678123456781234567812345678123456781234567812345678",
              "test",
              "test",
              18
        ]

        // transfer some origin token to contract for claim
        await erc20Mock.connect(owner).transfer(genericBridge.address, 100000)

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256[]', 'bytes32', 'string', 'string', 'uint8'],
          [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals]
        )
        
        const _claimId = ethers.utils.arrayify(ethers.utils.keccak256(encoded)) 
        const signature1 = ethers.utils.splitSignature(await v0.signMessage(_claimId))
        const signature2 = ethers.utils.splitSignature(await v1.signMessage(_claimId))
        const signature3 = ethers.utils.splitSignature(await v2.signMessage(_claimId))

        expect(await genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.emit(genericBridge, 'ClaimToken')
                        .withArgs(_originToken, _toAddr, _amount, _chainIdsIndex[0], _chainIdsIndex[1], chainID, _chainIdsIndex[3], '0x' + Buffer.from(_claimId).toString('hex'))
      })

      it("Claim origin token in case of native token", async () => {
        const [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals] = [
              "0x1111111111111111111111111111111111111111",
              user1.address,
              1000,
              [31337, 1, 31337, 1],
              "0x1234567812345678123456781234567812345678123456781234567812345678",
              "test",
              "test",
              18
        ]

        // transfer some origin token to contract for claim
        await genericBridge.requestBridge(
          _originToken,
          _toAddr,
          10000,
          1,
          { value: 10000 }
        )

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256[]', 'bytes32', 'string', 'string', 'uint8'],
          [_originToken, _toAddr, _amount, _chainIdsIndex, _txHash, _name, _symbol, _decimals]
        )
        
        const _claimId = ethers.utils.arrayify(ethers.utils.keccak256(encoded)) 
        const signature1 = ethers.utils.splitSignature(await v0.signMessage(_claimId))
        const signature2 = ethers.utils.splitSignature(await v1.signMessage(_claimId))
        const signature3 = ethers.utils.splitSignature(await v2.signMessage(_claimId))

        expect(await genericBridge.connect(owner).claimToken(
          _originToken, 
          _toAddr, 
          _amount, 
          _chainIdsIndex, 
          _txHash, 
          [signature1.r, signature2.r, signature3.r], [signature1.s, signature2.s, signature3.s], [signature1.v, signature2.v, signature3.v], 
          _name, 
          _symbol,
          _decimals)).to.emit(genericBridge, 'ClaimToken')
                        .withArgs(_originToken, _toAddr, _amount, _chainIdsIndex[0], _chainIdsIndex[1], chainID, _chainIdsIndex[3], '0x' + Buffer.from(_claimId).toString('hex'))
      })
    })

})