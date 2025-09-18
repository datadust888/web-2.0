// web/tonconnect-stub.js
window.TonConnectStub = {
  isAvailable: true,
  async connect() {
    // In real integration you will open TonConnect modal
    // Here we simulate a successful connection
    return { account: 'EQC_example_wallet_address', displayName: 'DemoWallet' };
  },
  async disconnect() {
    return true;
  }
};