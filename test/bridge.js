const { expect } = require("chai");
const { ethers } = require("hardhat");

const WAITING_TIME = 7000
const LOCKING_TOKEN_MAX = 5000000000
const BONDING_AMOUNT = 1000000

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("Validator", function() {
  it("Bonding", async function() {
    const [owner, validator1] = await ethers.getSigners();

    const DTOToken = await ethers.getContractFactory("DTOToken");
    const DTOTokenInstance = await DTOToken.deploy();
    dtotoken = await DTOTokenInstance.deployed();

    const LockingToken = await ethers.getContractFactory("LockingTokenValidator");
    const LockingTokenInstance = await LockingToken.deploy();
    lockingtoken = await LockingTokenInstance.deployed();

    const DTOBonding = await ethers.getContractFactory("DTOBonding");
    const dtobonding = await DTOBonding.deploy(BONDING_AMOUNT, dtotoken.address, lockingtoken.address);
    await dtobonding.deployed();

    await dtotoken.transfer(validator1.address, BONDING_AMOUNT);
    await dtotoken.approve(dtobonding.address, LOCKING_TOKEN_MAX);
    await dtotoken.connect(validator1).approve(dtobonding.address, LOCKING_TOKEN_MAX);
    lockingtoken.setLockers([dtobonding.address], true);

    await dtobonding.applyValidtor();
    [addr, block, timestamp] = await dtobonding.getPendingValidatorInfo(owner.address);
    expect(block).to.gt(0);

    await sleep(WAITING_TIME);
    await dtobonding.foundationApproveValidator(owner.address);
    expect(await dtobonding.isValidator(owner.address)).to.equal(true);

    await dtobonding.connect(validator1).applyValidtor();
    [addr1, block1, timestamp1] = await dtobonding.connect(validator1.address).getPendingValidatorInfo(validator1.address);
    expect(block1).to.gt(0);

    await sleep(WAITING_TIME);
    await dtobonding.approveValidator(validator1.address);
    await dtobonding.foundationApproveValidator(validator1.address);
    expect(await dtobonding.isValidator(validator1.address)).to.equal(true);

    await dtobonding.connect(validator1).resignValidator();
    [isWithdrawns, tokens, unlockableAts, amounts] = await dtobonding.getLockInfo(validator1.address);
    expect(isWithdrawns[0]).to.equal(false);
    expect(amounts[0]).to.equal(BONDING_AMOUNT);
  });
});