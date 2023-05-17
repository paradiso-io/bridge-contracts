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
    case 'shardeumsphinx': return 8082;
    case 'shardeumliberty': return 8080;
    case 'goerli': return 5;
    case 'sepolia': return 11155111;
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
    case 8082: return "ShardeumSphinx";
    case 80820: return "ShardeumLiberty10";
    case 11155111: return "Sepolia";
    case 5: return "Goerli";
    default: return 'Unknown';
  }
};


const supportedChainIds = (mainnet) => {
  if (!mainnet) return [3, 4, 42, 31337, 56, 97, 1287, 4002, 80001, 43114, 89, 96945816564243, 5, 11155111]
  //support ethereum and casper initially
  return [1, 131614895977472, 56, 1284, 43114, 66]
}
const approvers = (mainnet) => {
  if (mainnet) {
    return ["0x8e03b2f204a64E3AC0A627C16A2eB64962eD1Cb0", "0xd5D61992B9cEEEB0b2fBeaa3F796eD515A42f029", "0xb86DBF025E873F5AdC87C20f95627352C7762070", "0x45Ff52d6529A9EE855C1B2c4C0A90b1c13Bb32A9", "0x581e803a18d7F2B280E954050E1722eE8DF81df8", "0x0b733C3Af0D9376cfca9D6c1Dc5f26e2D1778e0a", "0xFCDd3d5447030aD57d613978bdAf40BC8B13CC6F", "0x4DfeCcc8eA948986776429aDeC30540A45705015"]
  } else {
    return ["0x3cdc0b9a2383770c24ce335c07ddd5f09ee3e199", "0xdcaf39430997de9a96a088b31c902b4d10a55177", "0xc91b38d5bf1d2047529446cf575855e0744e9334"]
  }
} 

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
  approvers
};
