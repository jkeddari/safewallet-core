import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import assert from 'assert'
import { TransactionDescription } from '@ethersproject/abi'
import { BigNumber } from 'ethers'
import { SafeWallet } from '../typechain-types'

describe('SafeWallet', function () {
  let wallet: SafeWallet

  before(async function () {
    ;[this.owner, this.addr1, this.addr2, this.addr3, this.addr5, this.addr6, ...this.addrs] = await ethers.getSigners()
    const SafeWallet = await ethers.getContractFactory('SafeWallet')
    let owners: string[] = [this.owner.address, this.addr1.address]

    wallet = await SafeWallet.deploy(owners, 2)
  })

  describe('Deployment', function () {
    it('empty owner list', async function () {
      const SafeWallet = await ethers.getContractFactory('SafeWallet')
      let owners: string[] = []
      await expect(SafeWallet.deploy(owners, 1)).to.be.revertedWith('safewallet: owner required')
    })

    it('bad confirmation number', async function () {
      const SafeWallet = await ethers.getContractFactory('SafeWallet')
      let owners: string[] = [this.owner.address, this.addr1.address]
      await expect(SafeWallet.deploy(owners, 0)).to.be.revertedWith('safewallet: invalid required confirmations')
      await expect(SafeWallet.deploy(owners, 3)).to.be.revertedWith('safewallet: invalid required confirmations')
    })

    it('bad address', async function () {
      const SafeWallet = await ethers.getContractFactory('SafeWallet')
      let owners: string[] = [this.owner.address, '0x0000000000000000000000000000000000000000']
      await expect(SafeWallet.deploy(owners, 1)).to.be.revertedWith('safewallet: invalid owner address')

      owners = [this.owner.address, this.owner.address]
      await expect(SafeWallet.deploy(owners, 1)).to.be.revertedWith('safewallet: owner must be unique')
    })

    it('Should set rigth balance and owner', async function () {
      expect(await ethers.provider.getBalance(wallet.address)).to.equal(0)
    })
  })

  describe('Transaction', async function () {
    it('Adding funds', async function () {
      expect(
        await this.owner.sendTransaction({
          to: wallet.address,
          value: 100,
        })
      ).to.changeEtherBalance(ethers.provider.getBalance(wallet.address), 100)
    })

    it('new transaction by owner', async function () {
      await expect(wallet.newTransaction(this.addr5.address, 50))
        .to.emit(wallet, 'NewTransaction')
        .withArgs(this.owner.address, 0, this.addr5.address, 50)
    })

    it('new transaction by other address SHOULD FAIL', async function () {
      await expect(wallet.connect(this.addr3).newTransaction(this.addr3.address, 50)).to.be.revertedWith(
        /AccessControl: account .* is missing role .*/
      )
    })

    it('new transaction by other address SHOULD FAIL', async function () {
      await expect(wallet.connect(this.addr3).newTransaction(this.addr3.address, 50)).to.be.revertedWith(
        /AccessControl: account .* is missing role .*/
      )
    })

    it('confirm with not owner SHOUD FAIL', async function () {
      await expect(wallet.connect(this.addr3).confirmTransaction(0)).to.be.revertedWith(
        /AccessControl: account .* is missing role .*/
      )
    })

    it('confirm with owner', async function () {
      await expect(wallet.connect(this.addr1).confirmTransaction(0))
        .to.emit(wallet, 'ConfirmTransaction')
        .withArgs(this.addr1.address, 0)
      await expect(wallet.confirmTransaction(0))
        .to.changeEtherBalance(this.addr5, 50)
        .to.emit(wallet, 'ConfirmTransaction')
        .withArgs(this.owner.address, 0)
        .to.emit(wallet, 'ExecuteTransaction')
        .withArgs(0)
    })
  })
})
