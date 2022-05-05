export function coinsList(state) {
  if (Array.isArray(state.coinsList)) return []
  return state.coinsList
}

export function currencyOptions(state) {
  if (!Array.isArray(state.currencyOptions)) return []
  return state.currencyOptions
}

export function selectedCurrency(state) {
  return state.selectedCurrency
}

export function assetPrices(state) {
  if (!Array.isArray(state.assetPrices)) return []
  return state.assetPrices
}

export function getAssetPrice(state) {
  return (assetId, currencySymbol) => {
    // 1. check if asset price for assetId exists
    if (!Array.isArray(state.assetPrices)) return null
    const assetPrice = state.assetPrices.find(assetPrice => assetPrice && assetPrice.assetId === assetId)
    if (!assetPrice || !assetPrice.prices) return null

    // 2. check if resolved asset price from coingecko has the currency it is looking for
    const parsedCurrencySymbol = String(currencySymbol).toLowerCase()
    if (assetPrice.prices[parsedCurrencySymbol]) return assetPrice.prices[parsedCurrencySymbol]

    // 3. step 2 has none, check if has usd rates & calculate
    if (!state.usdRates || !state.usdRates[parsedCurrencySymbol.toUpperCase()]) return null
    if (!assetPrice.prices.usd) return null

    return Number(state.usdRates[parsedCurrencySymbol.toUpperCase()]) * Number(assetPrice.prices.usd)
  }
}
