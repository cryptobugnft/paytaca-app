const Watchtower = require('watchtower-cash-js')
const BCHJS = require('@psf/bch-js')
const sha256 = require('js-sha256')
const bchjs = new BCHJS()

export class SlpWallet {
  constructor (projectId, mnemonic, path) {
    this.mnemonic = mnemonic
    this.derivationPath = path
    this.watchtower = new Watchtower()
    this.projectId = projectId
    this.walletHash = this.getWalletHash()
  }

  getWalletHash () {
    const mnemonicHash = sha256(this.mnemonic)
    const derivationPath = sha256(this.derivationPath)
    const walletHash = sha256(mnemonicHash + derivationPath)
    return walletHash
  }

  async _getChildNode (index) {
    const seedBuffer = await bchjs.Mnemonic.toSeed(this.mnemonic)
    const masterHDNode = bchjs.HDNode.fromSeed(seedBuffer)
    const childNode = masterHDNode.derivePath(this.derivationPath + '/' + index)
    return childNode
  }

  async getXPubKey () {
    const seedBuffer = await bchjs.Mnemonic.toSeed(this.mnemonic)
    const masterHDNode = bchjs.HDNode.fromSeed(seedBuffer)
    const childNode = bchjs.HDNode.derivePath(masterHDNode, this.derivationPath)
    return bchjs.HDNode.toXPub(childNode)
  }

  async getAddress (index) {
    const childNode = await this._getChildNode(index)
    const address = bchjs.HDNode.toSLPAddress(childNode)
    const data = {
      address: address,
      projectId: this.projectId,
      walletHash: this.walletHash,
      walletIndex: index
    }
    const result = await this.watchtower.subscribe(data)
    if (result.success) {
      return address
    } else {
      return null
    }
  }

  async getPrivateKey (index) {
    const childNode = await this._getChildNode(index)
    return bchjs.HDNode.toWIF(childNode)
  }

  async getBalance (tokenId) {
    const walletHash = this.getWalletHash()
    const request = await this.watchtower.Wallet.getBalance({ walletHash, tokenId })
    return request
  }

  async getTransactions (tokenId) {
    const walletHash = this.getWalletHash()
    const request = await this.watchtower.Wallet.getHistory({ walletHash, tokenId })
    return request
  }

  async sendSlp (amount, tokenId, recipient) {
    console.log(`Sending ${amount} of SLP token ${tokenId} to ${recipient}`)
    const data = {
      sender: this.walletHash,
      recipients: [
        {
          address: recipient,
          amount: amount
        }
      ],
      tokenId: tokenId,
      feeFunder: {
        address: 'bitcoincash:qp6ls99pxdfsvue4jqhla0esjjm7h685xu5q03v058',
        wif: 'KzUhaNJriJANDRigMoaSGdiGj9D6TmVGTrxgMwujVTnE4HfXwXRs'
      },
      wallet: {
        mnemonic: this.mnemonic,
        derivationPath: this.derivationPath
      },
      broadcast: true
    }
    const result = await this.watchtower.SLP.Type1.send(data)
    return result
  }
}

export default SlpWallet