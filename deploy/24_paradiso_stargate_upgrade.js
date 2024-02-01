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

  let extendAddress = require(`../deployments/${chainId}/ParadisoRebalance.json`).address
  log('Deploying ParadisoStargate...')

  const ParadisoRebalance = await ethers.getContractFactory('ParadisoRebalance');
  const stakingRouterInstance = await ParadisoRebalance.deploy()
  const newExtend = await stakingRouterInstance.deployed()
  log('new router address : ', newExtend.address)



  log('upgrade to new implement...')
  let router = await ParadisoRebalance.attach(extendAddress)

  await router.upgradeTo(newExtend.address, {gasLimit: '500000'})
  log('\n  Contract Deployment Data saved to "deployments" directory.');

  log("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

module.exports.tags = ["paradiso_stargate_upgrade"];
