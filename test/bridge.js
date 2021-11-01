const { expect } = require("chai");
const { ethers } = require("hardhat");

// describe("Bridge", function() {
//   it("Deployment should assign the total supply of tokens to the owner", async function() {
//     const [owner] = await ethers.getSigners();

//     const Token = await ethers.getContractFactory("Token");

//     const hardhatToken = await Token.deploy();

//     const ownerBalance = await hardhatToken.balanceOf(owner.address);
//     expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
//   });
// });

describe("Validator", function() {
  it("Bonding", async function() {
    // const [owner] = await ethers.getSigners();

    const DTOToken = await ethers.getContractFactory("DTOToken");
    const dtotoken = await DTOToken.deploy();
    await dtotoken.deployed()

    const DTOBonding = await ethers.getContractFactory("DTOBonding");
    const dtobonding = await DTOBonding.deploy(1000000, dtotoken.address);
    await dtobonding.deployed()

    expect(await dtobonding.pendingValidators.length).to.equal(0);
    await dtobonding.applyValidtor();
    expect(await dtobonding.pendingValidators.length).to.equal(1);
  });
});