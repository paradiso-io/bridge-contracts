const {
  chainNameById,
  chainIdByName,
  log,
} = require("../js-helpers/deploy");


module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } =
    await getNamedAccounts();
  const network = await hre.network;

  const chainId = chainIdByName(network.name);
  if (chainId === 31337) return


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
  log("  Deploying GenericBridge...");
  const GenericBridgeAddress =
    require(`../deployments/${chainId}/GenericBridge.json`).address;
  const GenericBridge = await ethers.getContractFactory("GenericBridge");
  await upgrades.upgradeProxy(GenericBridgeAddress, GenericBridge, {
    kind: "uups",
    gasLimit: 1000000,
  })
  log('\n  Contract Deployment Data saved to "deployments" directory.');

  log("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

module.exports.tags = ["protocolupgrade"];
