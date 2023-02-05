import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
require('dotenv').config()

console.log(process.env.MUMBAI_RPC_URL as string)

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  paths: {
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL as string,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL as string,
      accounts: [process.env.PRIVATE_KEY as string],
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL as string,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}

export default config
