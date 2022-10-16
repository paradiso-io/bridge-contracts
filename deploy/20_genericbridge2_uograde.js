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
  const alchemyTimeout = chainId === 31337 ? 0 : chainId === 1 ? 5 : 3;

  log("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  log("DTO Multichain GenericBridge2 Protocol - Contract Deployment");
  log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");

  log("  Using Network: ", chainNameById(chainId));
  log("  Using Accounts:");
  log("  - Deployer:          ", deployer);
  log("  - network id:          ", chainId);
  log("  - Owner:             ", protocolOwner);
  log("  - Trusted Forwarder: ", trustedForwarder);
  log(" ");
  log("  Deploying GenericBridge2 upgrade...");
  const GenericBridge2Address =
    require(`../deployments/${chainId}/GenericBridge2.json`).address;
  const GenericBridge2 = await ethers.getContractFactory("GenericBridge2");
  // let bridge = await upgrades.forceImport(GenericBridgeAddress, GenericBridge, {
  //   kind: "uups",
  //   gasLimit: 1000000,
  // });

  await upgrades.upgradeProxy(GenericBridge2Address, GenericBridge2, {
    kind: "uups",
    gasLimit: 1000000,
  })
  //saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');

  log("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

module.exports.tags = ["genericbridge2upgrade"];
