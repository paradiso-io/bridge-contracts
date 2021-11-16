const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const WAITING_TIME = 10000
const BONDING_AMOUNT = 1000000
const MIN_WAITING = 5000
const APPROVE_PERCENT_THRESHOLD = 100
const MAX_LOCKING_TOKEN = 5000000000
const POOL_LOCKED_TIME = 3600

describe("Validator", async function() {
    const [owner, validator1] = await ethers.getSigners();
    let dtotoken, lockingtoken, dtobonding;

    beforeEach(async () => {
        const DTOToken = await ethers.getContractFactory("DTOToken");
        const DTOTokenInstance = await DTOToken.deploy();
        dtotoken = await DTOTokenInstance.deployed();

        const LockingToken = await ethers.getContractFactory("LockingTokenValidator");
        const LockingTokenInstance = await LockingToken.deploy();
        lockingtoken = await LockingTokenInstance.deployed();

        const DTOBonding = await ethers.getContractFactory("DTOBonding");
        dtobonding = await upgrades.deployProxy(DTOBonding, [dtotoken.address, lockingtoken.address, BONDING_AMOUNT, MIN_WAITING, APPROVE_PERCENT_THRESHOLD, MAX_LOCKING_TOKEN, POOL_LOCKED_TIME], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,

        await dtotoken.transfer(validator1.address, BONDING_AMOUNT);
        await dtotoken.approve(dtobonding.address, MAX_LOCKING_TOKEN);
        await dtotoken.connect(validator1).approve(dtobonding.address, MAX_LOCKING_TOKEN);
        await lockingtoken.initialize(dtobonding.address);
    })
    it("Bonding", async function() {
        await dtobonding.applyValidtor();
        [addr, block, timestamp] = await dtobonding.getPendingValidatorInfo(owner.address);
        expect(block).to.gt(0);
        console.log(dtobonding.address);

        await ethers.provider.send('evm_increaseTime', [WAITING_TIME]); 
        await dtobonding.foundationApproveValidator(owner.address);
        expect(await dtobonding.isValidator(owner.address)).to.equal(true);

        await dtobonding.connect(validator1).applyValidtor();
        [addr1, block1, timestamp1] = await dtobonding.connect(validator1).getPendingValidatorInfo(validator1.address);
        expect(block1).to.gt(0);

        await ethers.provider.send('evm_increaseTime', [WAITING_TIME]); 
        await dtobonding.approveValidator(validator1.address);
        await dtobonding.foundationApproveValidator(validator1.address);
        expect(await dtobonding.isValidator(validator1.address)).to.equal(true);

        await dtobonding.connect(validator1).resignValidator();
        [isWithdrawns, tokens, unlockableAts, amounts] = await dtobonding.getLockInfo(validator1.address);
        expect(isWithdrawns[0]).to.equal(false);
        expect(amounts[0]).to.equal(BONDING_AMOUNT);
    })
    it("upgrade bonding contract", async function (){ 
        const DTOBondingUpgradeable = await ethers.getContractFactory('DTOBondingUpgradeable')
        MAX_LOCKING_TOKEN_UPGRADEABLE = MAX_LOCKING_TOKEN + 1000
        dtobondingupgradeable = await upgrades.upgradeProxy(dtobonding.address, DTOBondingUpgradeable, { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,
        await dtobondingupgradeable.setMaxLockingToken(MAX_LOCKING_TOKEN_UPGRADEABLE);
        expect(await dtobondingupgradeable.getMaxLockingToken()).to.be.equal(MAX_LOCKING_TOKEN_UPGRADEABLE);
    })  
})