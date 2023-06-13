const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
  log,
  supportedChainIds,
  approvers,
} = require('../js-helpers/deploy')

const _ = require('lodash')

module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts()
  const network = await hre.network
  const deployData = {}

  const chainId = chainIdByName(network.name)
  if (chainId === 31337) return

  const alchemyTimeout = chainId === 31337 ? 0 : chainId === 1 ? 5 : 3

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  log('DTO Multichain Bridge Oracle Protocol - Contract Deployment')
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')

  log('  Using Network: ', chainNameById(chainId))
  log('  Using Accounts:')
  log('  - Deployer:          ', deployer)
  log('  - network id:          ', chainId)
  log('  - Owner:             ', protocolOwner)
  log('  - Trusted Forwarder: ', trustedForwarder)
  log(' ')

  log('  Deploying DTOVesting2...')

  if (chainId == 31337) {
    return
  }

  const DTOVesting2 = await ethers.getContractFactory('DTOVesting2')

  const dtoVesting = await upgrades.deployProxy(DTOVesting2, [], {
    unsafeAllow: ['delegatecall'],
    kind: 'uups',
    gasLimit: 1500000,
  })

  log('  - DTOVesting:         ', dtoVesting.address)
  deployData['DTOVesting2'] = {
    abi: getContractAbi('DTOVesting2'),
    address: dtoVesting.address,
    deployTransaction: dtoVesting.deployTransaction,
  }

  saveDeploymentData(chainId, deployData)
  log('\n  Contract Deployment Data saved to "deployments" directory.')
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
}

module.exports.tags = ['dtovesting2']
