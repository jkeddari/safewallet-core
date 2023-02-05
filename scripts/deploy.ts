import { ethers } from 'hardhat'

async function main() {
  const [owner, addr1] = await ethers.getSigners()
  const Wallet = await ethers.getContractFactory('SafeWallet')
  let owners: string[] = [owner.address, addr1.address]
  const wallet = await Wallet.deploy(owners, 1)

  await wallet.deployed()

  console.log(`SafeWallet deployed to ${wallet.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
