const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
  log,
  supportedChainIds,
  approvers,
} = require("../js-helpers/deploy");

const _ = require("lodash");

module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } =
    await getNamedAccounts();
  const network = await hre.network;
  const deployData = {};

  const chainId = chainIdByName(network.name);
  if (chainId === 31337) return

  const alchemyTimeout = chainId === 31337 ? 0 : chainId === 1 ? 5 : 3;

  log("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  log("DTO Multichain Bridge Protocol - Contract Deployment");
  log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");

  log("  Using Network: ", chainNameById(chainId));
  log("  Using Accounts:");
  log("  - Deployer:          ", deployer);
  log("  - network id:          ", chainId);
  log("  - Owner:             ", protocolOwner);
  log("  - Trusted Forwarder: ", trustedForwarder);
  log(" ");
  log("  Deploying NFT721Bridge...");
  const NFTBridgeAddress =
    require(`../deployments/${chainId}/NFT721Bridge.json`).address;
  const NFT721Bridge = await ethers.getContractFactory("NFT721Bridge");
  const NFT721BridgeOld = await ethers.getContractFactory("NFT721BridgeOld");
  // let contracts = await upgrades.forceImport(NFTBridgeAddress, NFT721BridgeOld, {
  //   kind: "uups",
  //   gasLimit: 1000000,
  // })

  // console.log(contracts)
  await upgrades.upgradeProxy(NFTBridgeAddress, NFT721Bridge, {
    kind: "uups",
    gasLimit: 1000000,
  })

  //saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');

  log("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

module.exports.tags = ["nft721protocolupgrade"];
