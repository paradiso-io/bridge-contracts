require("dotenv").config();

require("@nomiclabs/hardhat-web3");

const {
  TASK_TEST,
  TASK_COMPILE_GET_COMPILER_INPUT,
} = require("hardhat/builtin-tasks/task-names");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("hardhat-abi-exporter");
require("solidity-coverage");
require("hardhat-deploy-ethers");
require("hardhat-deploy");
require('hardhat-contract-sizer');
require("solidity-coverage");
// require("@nomicfoundation/hardhat-toolbox")

// This must occur after hardhat-deploy!
task(TASK_COMPILE_GET_COMPILER_INPUT).setAction(async (_, __, runSuper) => {
  const input = await runSuper();
  input.settings.metadata.useLiteralContent =
    process.env.USE_LITERAL_CONTENT != "false";
  console.log(
    `useLiteralContent: ${input.settings.metadata.useLiteralContent}`
  );
  return input;
});

// Task to run deployment fixtures before tests without the need of "--deploy-fixture"
//  - Required to get fixtures deployed before running Coverage Reports
task(TASK_TEST, "Runs the coverage report", async (args, hre, runSuper) => {
  await hre.run("compile");
  await hre.deployments.fixture();
  return runSuper({ ...args, noCompile: true });
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_APIKEY}`,
      gasPrice: 10e9,
      blockGasLimit: 12400000,
      accounts: [process.env.PRIVATE_KEY],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_APIKEY}`,
      gasPrice: 10e9,
      blockGasLimit: 12400000,
      accounts: [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_APIKEY}`,
      gasPrice: 10e9,
      blockGasLimit: 12400000,
      accounts: [process.env.PRIVATE_KEY],
    },
    bsc: {
      url: `https://bsc-dataseed.binance.org/`,
      gasPrice: 6e9,
      blockGasLimit: 22400000,
      accounts: [process.env.PRIVATE_KEY_MAINNET],
    },
    bsctestnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      gasPrice: 10e9,
      gasLimit: 10000000,
      blockGasLimit: 22400000,
      accounts: [process.env.PRIVATE_KEY_NFTBRIDGE_TESTNET],
    },
    sepolia: {
      url: `https://rpc.sepolia.dev`,
      gasPrice: 10e9,
      gasLimit: 10000000,
      blockGasLimit: 22400000,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_APIKEY}`,
      gasPrice: 20e9,
      // blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY_MAINNET],
    },
    moonbeamtestnet: {
      url: `https://rpc.api.moonbase.moonbeam.network`,
      gasPrice: 5e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    fantomtestnet: {
      url: `https://xapi.testnet.fantom.network/lachesis`,
      // gasPrice: 250e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    mumbaitestnet: {
      //matic
      url: `https://rpc-mumbai.maticvigil.com/`,
      // gasPrice: 20e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    fujitestnet: {
      //avalanche
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      // gasPrice: 25e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    tomotestnet: {
      url: `https://rpc.testnet.tomochain.com`,
      gasPrice: 1e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    huobitestnet: {
      url: 'https://http-testnet.hecochain.com',
      gasPrice: 1e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    okextestnet: {
      url: 'https://exchaintestrpc.okex.org',
      gasPrice: 1e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    gatetestnet: {
      url: 'https://meteora-evm.gatenode.cc',
      gasPrice: 5e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    cubetestnet: {
      url: 'https://http-testnet.cube.network',
      gasPrice: 1e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    avalaunche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 30e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY_MAINNET],
    },
    moonbeam: {
      url: 'https://rpc.api.moonbeam.network',
      gasPrice: 101e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY_MAINNET],
    },
    okc: {
      url: 'https://exchainrpc.okex.org',
      gasPrice: 1e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY_MAINNET],
    },
    shardeumsphinx: {
      url: 'https://sphinx.shardeum.org/',
      gasPrice: 1e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    shardeumliberty: {
      url: 'https://liberty10.shardeum.org/',
      gasPrice: 8e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: 'https://goerli.infura.io/v3/3a6c72cdf9e846968d21c0f3605013fd',
      gasPrice: 150e9,
      blockGasLimit: 12487794,
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // solidity: {
  //   compilers : [
  //     {
  //     version: "0.7.0",
  //   },
  //   {
  //     version: "0.8.0",
  //   },
  //   {
  //     version: "0.8.2",
  //   }
  // ]

  // },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./build/artifacts",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  mocha: {
    timeout: 20000,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 1,
    enabled: process.env.REPORT_GAS ? true : false,
  },
  abiExporter: {
    path: "./abi",
    clear: true,
    flat: true,
  },
  etherscan: {
    // apiKey: process.env.ETHERSCAN_APIKEY
    apiKey: {
      bsctestnet: process.env.BSC_APIKEY,
      bsc: process.env.BSC_APIKEY,
      moonbeam: process.env.MOONSCAN_APIKEY,
      mainnet: process.env.ETHERSCAN_APIKEY
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    protocolOwner: {
      default: 1,
    },
    initialMinter: {
      default: 2,
    },
    user1: {
      default: 3,
    },
    user2: {
      default: 4,
    },
    user3: {
      default: 5,
    },
    trustedForwarder: {
      default: 7, // Account 8
      1: "0x1337c0d31337c0D31337C0d31337c0d31337C0d3", // mainnet
      3: "0x1337c0d31337c0D31337C0d31337c0d31337C0d3", // ropsten
      4: "0x1337c0d31337c0D31337C0d31337c0d31337C0d3", // rinkeby
      42: "0x1337c0d31337c0D31337C0d31337c0d31337C0d3", // kovan
    },
  },
};
