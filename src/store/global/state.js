export default function () {
  return {
    wallets: {
      bch: {
        walletHash: '',
        derivationPath: '',
        xPubKey: '',
        lastAddress: '',
        lastAddressIndex: 0
      },
      slp: {
        walletHash: '',
        derivationPath: '',
        xPubKey: '',
        lastAddress: '',
        lastAddressIndex: 0
      }
    },
    user: {
      onboardingStep: 0,
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: ''
    }
  }
}
