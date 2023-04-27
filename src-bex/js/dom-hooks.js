// Hooks added here have a bridge allowing communication between the Web Page and the BEX Content Script.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/dom-hooks

import { stringify } from "@bitauth/libauth";

class Paytaca extends EventTarget {
  constructor (bridge) {
    super();
    this.bridge = bridge;

    this.bridge.on("window.paytaca.addressChanged", (event) => {
      this.dispatchEvent(new CustomEvent("addressChanged", { detail: event.data.address }));
    });
  }

  callbackMap = {};

  addEventListener (event, callback, ) {
    const wrapper = (event => callback(event.detail));
    this.callbackMap[callback] = wrapper;
    super.addEventListener(event, wrapper);
  }

  on (event, callback, options) {
    this.addEventListener(event, callback, options);
  }

  once (event, callback, options) {
    this.addEventListener(event, callback, { ...options, once: true });
  }

  off (event, callback) {
    this.removeEventListener(event, this.callbackMap[callback]);
    delete this.callbackMap[callback];
  }

  send (assetId, amount, recipient) {
    this.bridge.send('window.paytaca.send', {
      assetId: assetId,
      amount: amount,
      recipient: recipient
    })
  }

  payToConnecta (paymentRequestData, orderId) {
    this.bridge.send('window.paytaca.connecta', {
      paymentRequestData,
      orderId
    })
  }

  async connect () {
    const response = await this.bridge.send('window.paytaca.connect', {
      origin: window.location.origin
    })

    this.dispatchEvent(new CustomEvent("addressChanged", { detail: response.data.address }));

    return response.data
  }

  async connected () {
    const response = await this.bridge.send('window.paytaca.connected', {
      origin: window.location.origin
    })
    return response.data
  }

  async disconnect () {
    const response = await this.bridge.send('window.paytaca.disconnect', {
      origin: window.location.origin
    })

    this.dispatchEvent(new CustomEvent("addressChanged", { detail: response.data.address }));

    return response.data
  }

  async address (assetId) {
    const connected = await this.connected();

    if (!connected) {
      return undefined;
    }

    const response = await this.bridge.send('window.paytaca.address', {
      origin: window.location.origin,
      assetId: assetId
    })
    return response.data
  }

  async signMessage (assetId, message) {
    const connected = await this.connected();

    if (!connected) {
      return undefined;
    }

    const response = await this.bridge.send('window.paytaca.signMessage', {
      origin: window.location.origin,
      assetId: assetId,
      message: message
    })
    return response.data
  }

  async signTransaction ({assetId, transaction, sourceOutputs, broadcast, userPrompt}) {
    const connected = await this.connected();

    if (assetId?.toLowerCase() === "sbch") {
      throw Error("Not supported yet");
    }

    if (!connected) {
      return undefined;
    }

    const response = await this.bridge.send('window.paytaca.signTransaction', {
      origin: window.location.origin,
      assetId: assetId,
      transaction: typeof transaction === "string" ? transaction : stringify(transaction, 0),
      sourceOutputs: stringify(sourceOutputs, 0),
      broadcast: broadcast,
      userPrompt: userPrompt,
    })
    return response.data
  }
}

export default function attachDomHooks (bridge) {
  // Inject Paytaca object into the window
  window.paytaca = new Paytaca(bridge)

  const connectaRegex = /^(app|http|https):\/\/(www.)?paytaca.com\/(payment-request|apps\/connecta)\/?/
  if (connectaRegex.test(location.href)) {
    const url = new URL(location.href)
    window.paytaca.payToConnecta(
      url.searchParams.get('d'),
      url.searchParams.get('orderId')
    )
    location.replace(location.origin)
  }
}
