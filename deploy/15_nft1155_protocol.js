const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
  log,
  supportedChainIds,
  approvers
} = require("../js-helpers/deploy");

const _ = require('lodash');
let sleep = async (time) => new Promise((resolve) => setTimeout(resolve, time))

module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
  const network = await hre.network;
  const deployData = {};

  const chainId = chainIdByName(network.name);
  if (chainId === 31337) return

  const alchemyTimeout = chainId === 31337 ? 0 : (chainId === 1 ? 5 : 3);

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

  log('  Deploying NFT1155Bridge...');
  // let mainnet = false
  // if (chainId == 1 || chainId == 56 || chainId == 43114 || chainId) mainnet = true
  console.log('supportedChainIds(chainId)', supportedChainIds(false))
  const NFT1155Bridge = await ethers.getContractFactory('NFT1155Bridge');
  const nftBridge = await upgrades.deployProxy(NFT1155Bridge, [supportedChainIds(chainId)], { kind: 'uups', gasLimit: 8000000 })

  log('  - NFT1155Bridge:         ', nftBridge.address);
  deployData['NFT1155Bridge'] = {
    abi: getContractAbi('NFT1155Bridge'),
    address: nftBridge.address,
    deployTransaction: nftBridge.deployTransaction,
  }
  await sleep(20000)
  await nftBridge.addApprovers(approvers)
  await nftBridge.setFeeReceiver("0x3b9cAeA186DbEFa01ef4e922e38d4a32dE2d51af")

  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['nft1155protocol']
