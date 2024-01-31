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

  log('  Deploying ParadisoRebalance...');
  const ParadisoRebalance = await ethers.getContractFactory('ParadisoRebalance');
  const paradisoRebalance = await upgrades.deployProxy(ParadisoRebalance, [], { kind: 'uups', gasLimit: 8000000, gasPrice: 25e9 })

  log('  - ParadisoRebalance:         ', paradisoRebalance.address);
  deployData['ParadisoRebalance'] = {
    abi: getContractAbi('ParadisoRebalance'),
    address: paradisoRebalance.address,
    deployTransaction: paradisoRebalance.deployTransaction,
  }
  await sleep(20000)
  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log('\n set stargate router \n');
  let stargateRouter
  if (chainId == 97) {
    stargateRouter = '0xB606AaA7E2837D4E6FC1e901Ba74045B29D2EB36'
  } else if (chainId == 11155111) {
    stargateRouter = '0x2836045A50744FB50D3d04a9C8D18aD7B5012102'
  } else if (chainId == 43113) {
    stargateRouter = '0x5C4948d523943090bd3AEbD06227272A6b581691'
  } else if (chainId == 421614) {
    stargateRouter = '0x2a4C2F5ffB0E0F2dcB3f9EBBd442B8F77ECDB9Cc'
  }
  await paradisoRebalance.setStargateRouter(stargateRouter)

  console.log('set operator')
  await router.grantRole("0x6f70657261746f72000000000000000000000000000000000000000000000000", '0x642c5C26912077DDb44Bb231e4dc35F0A0Ef7069')
  await router.grantRole("0x6f70657261746f72000000000000000000000000000000000000000000000000", '0x17d3fd6Ba3a65E5Aff6CAF9B70c8c5130aC1CE92')
  console.log('set validator')
  await router.grantRole("0x76616c696461746f720000000000000000000000000000000000000000000000", '0x642c5C26912077DDb44Bb231e4dc35F0A0Ef7069')
  await router.grantRole("0x76616c696461746f720000000000000000000000000000000000000000000000", '0x17d3fd6Ba3a65E5Aff6CAF9B70c8c5130aC1CE92')

};

module.exports.tags = ['paradiso_rebalance']
