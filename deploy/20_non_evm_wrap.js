const {
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  log,
  approvers
} = require("../js-helpers/deploy");

const _ = require('lodash');
const Web3 = require('web3')

module.exports = async (hre) => {
  const { ethers, upgrades, getNamedAccounts } = hre;
  const { deployer, protocolOwner, trustedForwarder } = await getNamedAccounts();
  const network = await hre.network;
  const deployData = {};

  const chainId = chainIdByName(network.name);
  if (chainId === 31337) return

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('DTO Multichain Bridge Protocol - WrapNonEVMERC20 Deployment');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log('  Using Network: ', chainNameById(chainId));
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - network id:          ', chainId);
  log('  - Owner:             ', protocolOwner);
  log('  - Trusted Forwarder: ', trustedForwarder);
  log(' ');

  log('  Deploying WrapNonEVMERC20...');

  const web3 = new Web3()
  const originTokenAddress = "a4fc3a16bd5431873ac121257d4c7f1d04b8db24229266ebce731d3417f38259"
  const originChainId = 96945816564243  // casper-test
  const tokenName = "Faucet Token"
  const tokenSymbol = "FTERC20"
  const decimals = 18
  const feeReceiver = '0x3b9cAeA186DbEFa01ef4e922e38d4a32dE2d51af'

  const EventHookInfo = require(`../deployments/${chainId}/EventHook.json`)

  const WrapNonEVMERC20 = await ethers.getContractFactory('WrapNonEVMERC20');

  console.log('param', originTokenAddress, originChainId, tokenName, tokenSymbol, decimals, feeReceiver, EventHookInfo.address)

  const WrapNonEVMERC20Instance = await WrapNonEVMERC20.deploy(originTokenAddress, originChainId, tokenName, tokenSymbol, decimals, feeReceiver, EventHookInfo.address)
  const wcst = await WrapNonEVMERC20Instance.deployed()
  log('  - FTERC20:         ', wcst.address);
  log('  - setting approvers now:         ');
  
  await wcst.addApprovers(approvers(false))
  // set event hook
  const EventHook = await ethers.getContractFactory('EventHook');
  const eventHook = await EventHook.attach(EventHookInfo.address)
  await eventHook.setNEVMWrapToken(wcst.address, true)

  deployData['FTERC20'] = {
    abi: getContractAbi('WrapNonEVMERC20'),
    address: wcst.address,
    deployTransaction: wcst.deployTransaction,
  }

  saveDeploymentData(chainId, deployData);
  log('\n  Contract Deployment Data saved to "deployments" directory.');

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['nonevmwrap']
