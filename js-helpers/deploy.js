const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const sleep = require('sleep-promise');

require('./chaiMatchers');

const toWei = ethers.utils.parseEther;
const toEth = ethers.utils.formatEther;
const toBN = ethers.BigNumber.from;
const toStr = (val) => ethers.utils.toUtf8String(val).replace(/\0/g, '');
const weiPerEth = ethers.constants.WeiPerEther;

const txOverrides = (options = {}) => ({gasLimit: 15000000, ...options});

const log = (...args) => {
  console.log(...args);
  return async (delay = 0) => (delay && await sleep(delay * 1000));
};

const chainIdByName = (chainName) => {
  switch (_.toLower(chainName)) {
    case 'mainnet': return 1;
    case 'ropsten': return 3;
    case 'rinkeby': return 4;
    case 'kovan': return 42;
    case 'hardhat': return 31337;
    case 'coverage': return 31337;
    case 'bsc': return 56;
    case 'bsctestnet': return 97;
    case 'moonbeamtestnet': return 1287;
    case 'fantomtestnet': return 4002;
    case 'mumbaitestnet': return 80001;
    case 'fujitestnet': return 43113;
    case 'tomotestnet': return 89;
    default: return 0;
  }
};

const chainNameById = (chainId) => {
  switch (parseInt(chainId, 10)) {
    case 1: return 'Mainnet';
    case 3: return 'Ropsten';
    case 4: return 'Rinkeby';
    case 42: return 'Kovan';
    case 31337: return 'Hardhat';
    case 56: return 'BSC';
    case 97: return 'BSCTestnet';
    case 1287: return 'MoonBeamTestnet';
    case 4002: return 'FantomTestnet';
    case 80001: return 'MumbaiTestnet';
    case 43113: return 'FujiTestnet';
    case 89: return 'TomoTestnet';
    default: return 'Unknown';
  }
};

const supportedChainIds = [1, 3, 4, 42, 31337, 56, 97, 1287, 4002, 80001, 43114, 89]
const approvers = ["0xcb02ea995b810802a2800a911e8eb56d233bb199", "0x18b5123d0a1b1a851dec08a29c081eda09b812e1","0xa3582c9183bcc50d886db0960b81b33b6d232a9c","0x889c8cb1b3dcc6380b3d936162865d68d6bac158","0xe6802aacac2020322eb26e8cb821b82a1e08cd28","0x901e950633929b62be3e35cc3c6e0deab3210a0a","0x5113a11eaad3c5c5a3edb2910193d1965c123ea8"]

const blockTimeFromDate = (dateStr) => {
  return Date.parse(dateStr) / 1000;
};

const ensureDirectoryExistence = (filePath) => {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

const saveDeploymentData = (chainId, deployData) => {
  const network = chainNameById(chainId).toLowerCase();
  const deployPath = path.join(__dirname, '..', 'deployments', `${chainId}`);

  _.forEach(_.keys(deployData), (contractName) => {
    const filename = `${deployPath}/${contractName}.json`;

    let existingData = {};
    if (fs.existsSync(filename)) {
      existingData = JSON.parse(fs.readFileSync(filename));
    }

    const newData = _.merge(existingData, deployData[contractName]);
    ensureDirectoryExistence(filename);
    fs.writeFileSync(filename, JSON.stringify(newData, null, "\t"));
  });
};

const getContractAbi = (contractName) => {
  const buildPath = path.join(__dirname, '..', 'abi');
  console.log('buildPath', buildPath)
  const filename = `${buildPath}/${contractName}.json`;
  const contractJson = require(filename);
  return contractJson;
};

const getDeployData = (contractName, chainId = 31337) => {
  const network = chainNameById(chainId).toLowerCase();
  const deployPath = path.join(__dirname, '..', 'deployments', network);
  const filename = `${deployPath}/${contractName}.json`;
  const contractJson = require(filename);
  return contractJson;
}

const getTxGasCost = ({deployTransaction}) => {
  const gasCost = toEth(deployTransaction.gasLimit.mul(deployTransaction.gasPrice));
  return `${gasCost} ETH`;
};

const getActualTxGasCost = async (txData) => {
  const txResult = await txData.wait();
  const gasCostEst = toEth(txData.gasLimit.mul(txData.gasPrice));
  const gasCost = toEth(txResult.gasUsed.mul(txData.gasPrice));
  return `${gasCost} ETH Used.  (Estimated: ${gasCostEst} ETH)`;
};

  
module.exports = {
  txOverrides,
  chainNameById,
  chainIdByName,
  saveDeploymentData,
  getContractAbi,
  getDeployData,
  getTxGasCost,
  getActualTxGasCost,
  log,
  toWei,
  toEth,
  toBN,
  toStr,
  supportedChainIds,
  approvers
};
