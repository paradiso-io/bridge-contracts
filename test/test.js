const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Validator", async function() {
    // const [owner, validator1] = await ethers.getSigners();
    // let dtotoken, lockingtoken, dtobonding;

    beforeEach(async () => {
        // const Test = await ethers.getContractFactory("Test");
        // test = await upgrades.deployProxy(Test, [], { unsafeAllow: ['delegatecall'], kind: 'uups' }) //unsafeAllowCustomTypes: true,
        const Test = await ethers.getContractFactory("Test");
        const TestInstance = await Test.deploy();
        test = await TestInstance.deployed();

    })
    it("Bonding", async function() {

        addr = await test.verifySignatures();
        console.log(addr);
    }) 
})