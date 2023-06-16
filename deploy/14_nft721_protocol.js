const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  log,
  supportedChainIds,
  approvers,
  toWei
} = require("../js-helpers/deploy");

let sleep = async (time) => new Promise((resolve) => setTimeout(resolve, time))

module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
  const network = await hre.network;
  const deployData = {};

  const chainId = chainIdByName(network.name);
  if (chainId === 31337) return


  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('DTO Multichain Bridge Protocol - Contract Deployment');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log('  Using Network: ', chainNameById(chainId));
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - network id:          ', chainId);
  log('  - Owner:             ', protocolOwner);
  log('  - Trusted Forwarder: ', trustedForwarder);
  log(' ');

  log('  Deploying NFT721Bridge...');
  const NFT721Bridge = await ethers.getContractFactory('NFT721Bridge');
  const nft721Bridge = await upgrades.deployProxy(NFT721Bridge, [supportedChainIds(false)], { kind: 'uups', gasLimit: 8000000 })

  log('  - NFT721Bridge:         ', nft721Bridge.address);
  deployData['NFT721Bridge'] = {
    abi: getContractAbi('NFT721Bridge'),
    address: nft721Bridge.address,
    deployTransaction: nft721Bridge.deployTransaction,
  }
  await sleep(20000)
  await nft721Bridge.setApprovers(approvers(true), true)
  await nft721Bridge.setFeeAndMinApprovers("0x3b9cAeA186DbEFa01ef4e922e38d4a32dE2d51af", toWei('0.8'), 6)

  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['nft721protocol']
