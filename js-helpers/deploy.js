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

const txOverrides = (options = {}) => ({ gasLimit: 15000000, ...options });

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
    case 'moonbeam': return 1284;
    case 'fantomtestnet': return 4002;
    case 'mumbaitestnet': return 80001;
    case 'fujitestnet': return 43113;
    case 'avalaunche': return 43114;
    case 'tomotestnet': return 89;
    case 'huobitestnet': return 256;
    case 'okc': return 66;
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
    case 43114: return 'avalaunche';
    case 1284: return 'moonbeam';
    case 89: return 'TomoTestnet';
    case 256: return 'HuobiTestnet';
    case 66: return "OKChain";
    default: return 'Unknown';
  }
};


const supportedChainIds = (mainnet) => {
  if (!mainnet) return [3, 4, 42, 31337, 56, 97, 1287, 4002, 80001, 43114, 89, 96945816564243]
  //support ethereum and casper initially
  return [1, 131614895977472, 56, 1284, 43114, 66]
}
const approvers = ["0x8e03b2f204a64E3AC0A627C16A2eB64962eD1Cb0", "0xd5D61992B9cEEEB0b2fBeaa3F796eD515A42f029", "0xb86DBF025E873F5AdC87C20f95627352C7762070", "0x45Ff52d6529A9EE855C1B2c4C0A90b1c13Bb32A9", "0x581e803a18d7F2B280E954050E1722eE8DF81df8", "0x0b733C3Af0D9376cfca9D6c1Dc5f26e2D1778e0a", "0xFCDd3d5447030aD57d613978bdAf40BC8B13CC6F", "0x4DfeCcc8eA948986776429aDeC30540A45705015"]
const approversTestnet = ["0x3cdc0b9a2383770c24ce335c07ddd5f09ee3e199", "0x6d378c3dc2eb8d433c3ddd6a62a6d41d44c18426", "0xc91b38d5bf1d2047529446cf575855e0744e9334", "0x99f3df513d1a13316cea132b1431223d9612caed", "0x6a61a3ced260433ddd6f8e181644d55753a5051d", "0x58d337a11f1f439839bd2b97e0ee8e6d753be5d7", "0x9c76f50a0ffd21525b1e6406e306b628f492c4be", "0x6a96eacff97c98c1d449d4e3634805241d85807f", "0x0ccacdd7c2f6bebe61e80e77b24e5de4d3b4c68b", "0xbe3ab443e16fdf70dfb35c73b45962cb56f9d9a6"]

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

const getTxGasCost = ({ deployTransaction }) => {
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
  approvers,
  approversTestnet
};
