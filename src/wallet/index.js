import { SlpWallet } from './slp'
import { SmartBchWallet } from './sbch'
import { BchWallet } from './bch'
import aes256 from 'aes256'
import { utils } from 'ethers'
import { convertCashAddress } from './chipnet'

import 'capacitor-secure-storage-plugin'
import { Plugins } from '@capacitor/core'

const { SecureStoragePlugin } = Plugins

const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

const projectId = {
  mainnet: process.env.WATCHTOWER_PROJECT_ID,
  chipnet: process.env.WATCHTOWER_CHIP_PROJECT_ID
}

export class Wallet {
  constructor (mnemonic, network = 'BCH') {
    this.mnemonic = mnemonic
    if (network === 'BCH') {
      this.loadBCH()
    } else if (network === 'sBCH') {
      this.loadSBCH()
    }
  }

  get BCH() {
    if (!this._BCH) this.loadBCH()
    return this._BCH
  }

  get BCH_CHIP() {
    if (!this._BCH_CHIP) this.loadBCH()
    return this._BCH_CHIP
  }

  get SLP() {
    if (!this._SLP) this.loadBCH()
    return this._SLP
  }

  get SLP_TEST() {
    if (!this._SLP_TEST) this.loadBCH()
    return this._SLP_TEST
  }

  get sBCH() {
    if (!this._sBCH) this.loadSBCH()
    return this._sBCH
  }

  loadBCH() {
    const derivationPaths = {
      bch: "m/44'/145'/0'",
      slp: "m/44'/245'/0'"
    }
    this._BCH = new BchWallet(projectId.mainnet, this.mnemonic, derivationPaths.bch) // Main BCH wallet
    this._BCH_CHIP = new BchWallet(projectId.chipnet, this.mnemonic, derivationPaths.bch, true) // Chip BCH wallet
    this._SLP = new SlpWallet(projectId.mainnet, this.mnemonic, derivationPaths.slp) // SLP wallet
    this._SLP_TEST = new SlpWallet(projectId.chipnet, this.mnemonic, derivationPaths.slp, true) // Test SLP wallet
  }

  loadSBCH() {
    this._sBCH = new SmartBchWallet(projectId.mainnet, this.mnemonic, "m/44'/60'/0'/0") // SmartBCH wallet
    this._sBCH.initWallet()
  }
}

export async function loadWallet(network = 'BCH', index = 0) {
  const mnemonic = await getMnemonic(index)
  return new Wallet(mnemonic, network)
}

export async function generateMnemonic (index = 0) {
  let key = 'mn'
  if (index !== 0) {
    key = key + index
  }
  const mnemonic = bchjs.Mnemonic.generate(128)
  await SecureStoragePlugin.set({ key: key, value: mnemonic })
  return mnemonic
}

export async function storeMnemonic (mnemonic, index = 0) {
  let key = 'mn'

  if (index !== 0) {
    key = key + index
  }
  await SecureStoragePlugin.set({ key: key, value: mnemonic })
  return mnemonic
}

export async function getMnemonic (index = 0) {
  let mnemonic = null
  let key = 'mn'

  if (index !== 0) {
    key = key + index
  }
  try {
    // For versions up to v0.9.1 that used to have aes256-encrypted mnemonic
    const secretKey = await SecureStoragePlugin.get({ key: 'sk' })
    const encryptedMnemonic = await SecureStoragePlugin.get({ key: key })
    mnemonic = aes256.decrypt(secretKey.value, encryptedMnemonic.value)
  } catch (err) {
    try {
      mnemonic = await SecureStoragePlugin.get({ key: key })
      mnemonic = mnemonic.value
    } catch (err) {}
  }
  return mnemonic
}

// export class Address {
//   constructor (address) {
//     this.address = address
//   }

//   isSep20Address () {
//     return utils.isAddress(this.address)
//   }

//   isLegacyAddress () {
//     return bchjs.Address.isLegacyAddress(this.address)
//   }

//   toLegacyAddress () {
//     return bchjs.Address.toLegacyAddress(this.address)
//   }

//   toCashAddress () {
//     return bchjs.Address.toCashAddress(this.address)
//   }

//   isCashAddress () {
//     return bchjs.Address.isCashAddress(this.address)
//   }

//   isMainnetCashAddress () {
//     return bchjs.Address.isMainnetAddress(this.address)
//   }

//   isTestnetCashAddress () {
//     return bchjs.Address.isTestnetAddress(this.address)
//   }

//   isSLPAddress () {
//     return bchjs.SLP.Address.isSLPAddress(this.address)
//   }

//   toSLPAddress () {
//     return bchjs.SLP.Address.toSLPAddress(this.address)
//   }

//   isMainnetSLPAddress () {
//     return bchjs.SLP.Address.isMainnetAddress(this.address)
//   }

//   isTestnetSLPAddress () {
//     return bchjs.SLP.Address.isTestnetAddress(this.address)
//   }

//   isValidBCHAddress (isChipnet) {
//     const isBCHAddr = this.isCashAddress()
//     if (isChipnet)
//       return isBCHAddr && this.isTestnetCashAddress()
//     return isBCHAddr && this.isMainnetCashAddress()
//   }

//   isValidSLPAddress (isChipnet) {
//     const isSLPAddr = this.isSLPAddress()
//     if (isChipnet)
//       return isSLPAddr && this.isTestnetSLPAddress()
//     return isSLPAddr && this.isMainnetSLPAddress()
//   }
// }

export { Address } from 'watchtower-cash-js';
