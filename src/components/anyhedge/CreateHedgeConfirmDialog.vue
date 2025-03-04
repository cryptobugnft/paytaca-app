<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    :transition-duration="250"
    transition-show="slide-up"
    transition-hide="slide-down"
    no-backdrop-dismiss
    no-shake
  >
    <q-card :class="darkMode ? 'pt-dark' : 'text-black'" class="br-15" style="max-width:450px;width:90vw;margin-bottom:3rem;">
      <div class="row no-wrap items-center justify-center q-pl-md q-mb-md">
        <div class="text-h6 q-space q-mt-sm">
          <template v-if="isPositionOffer">
            Position offer
            <template v-if="position === 'hedge'">(Hedge)</template>
            <template v-else-if="position === 'long'">(Long)</template>
          </template>
          <template v-else>
            <template v-if="position === 'hedge'">Stabilize (Hedge)</template>
            <template v-else-if="position === 'long'">Leverage (Long)</template>
            <template v-else>Hedge Contract</template>
          </template>
        </div>
        <q-btn
          flat
          padding="sm"
          icon="close"
          v-close-popup
        />
      </div>
      <q-card-section class="q-gutter-y-sm q-pt-none" style="max-height:calc(85vh - 5rem);overflow:auto;">
        <div>
          <div class="text-grey text-subtitle1">Contract Value</div>
          <div class="row items-start">
            <div class="col-6">
              <div class="text-grey-7">Hedge</div>
              <div v-if="contractValues.priceValue">
                {{ formatUnits(contractValues.hedge.nominalUnits, oracleInfo?.assetDecimals || 0) }} {{ oracleInfo?.assetCurrency || 'units' }}
              </div>
              <div>
                {{ contractValues.hedge.satoshis / (10**8) }} BCH
              </div>
            </div>
            <div class="col-6">
              <div class="text-grey-7">Long</div>
              <div v-if="contractValues.priceValue">
                {{ formatUnits(contractValues.long.nominalUnits, oracleInfo?.assetDecimals || 0) }} {{ oracleInfo?.assetCurrency || 'units' }}
              </div>
              <div>
                {{ contractValues.priceValue ? '' : '~' }}
                {{ contractValues.long.satoshis / (10**8) }} BCH
                <q-icon
                  v-if="!contractValues.priceValue"
                  :color="darkMode ? 'grey-7' : 'black'"
                  size="1.5em"
                  name="help"
                >
                  <q-popup-proxy :breakpoint="0">
                    <div :class="['q-px-md q-py-sm', darkMode ? 'pt-dark-label pt-dark' : 'text-black']" class="text-caption">
                      Long amount is only an approximation without a starting price value on the asset
                    </div>
                  </q-popup-proxy>
                </q-icon>
              </div>
            </div>
          </div>
          <q-separator :dark="darkMode"/>
        </div>
        <div v-if="fundingAmounts && !isPositionOffer">
          <div class="text-grey text-subtitle1">Funding</div>
          <div>
            <div
              class="row items-start q-pr-md"
              v-ripple style="position:relative;"
              @click="expandFundingAmounts.hedge = !expandFundingAmounts.hedge"
            >
              <div>
                <q-icon
                  name="arrow_right"
                  size="1.5em"
                  :style="{
                    transform: expandFundingAmounts.hedge ? 'rotate(90deg)' : '',
                    transition: 'transform 0.25s',
                  }"
                />
              </div>
              <div class="text-body1 text-grey">Hedge</div>
              <div class="q-space text-body1 text-right">{{ fundingAmounts?.hedge?.total / (10**8) }} BCH</div>
            </div>
            <q-slide-transition>
              <div v-if="expandFundingAmounts.hedge" class="q-pl-md">
                <div class="row items-start q-pr-md">
                  <div class="text-caption text-grey" style="margin-bottom:-0.5em">Contract</div>
                  <div class="q-space text-right">{{ fundingAmounts?.hedge?.sats / (10**8) }} BCH</div>
                </div>
                <div class="text-caption text-grey" style="margin-bottom:-0.5em">Fees</div>
                <div class="q-pl-md">
                  <div class="row items-start q-pr-md">
                    <div class="text-caption text-grey" style="margin-bottom:-0.5em">Network fee</div>
                    <div class="q-space text-right">{{ fundingAmounts?.hedge?.fees?.network / (10**8) }} BCH</div>
                  </div>
                  <div>
                    <div
                      v-for="(fee, index) in fundingAmounts?.hedge?.fees?.serviceFees" :key="index"
                      class="row items-start q-pr-md no-wrap"
                    >
                      <div class="text-caption text-grey ellipsis" style="margin-bottom:-0.5em">
                        <q-icon
                          v-if="fee?.stats?.pctg"
                          :color="fee?.stats?.icon?.color"
                          :name="fee?.stats?.icon?.name"
                          size="1.25em"
                        />
                        {{ fee?.name || ellipsisText(fee?.address) }}
                        <q-icon v-if="fee?.description" name="description"/>
                      </div>
                      <q-space/>
                      <div class="text-right q-ml-xs" style="white-space:nowrap">{{ fee?.satoshis / (10**8) }} BCH</div>
                      <q-popup-proxy v-if="fee?.description || fee?.stats?.pctg" :breakpoint="0">
                        <div :class="['q-px-md q-py-sm', darkMode ? 'pt-dark-label pt-dark' : 'text-black']">
                          <div v-if="fee?.name" class="text-subtitle1">{{ fee?.name }} </div>
                          <div v-if="fee?.stats?.pctg" class="text-caption" style="margin-top:-0.25em">
                            <span :class="['text-weight-medium', `text-${fee?.stats?.icon?.color}`]" style="word-break: keep-all;">
                              {{ formatUnits(fee?.stats?.pctg, 2) }}%
                            </span>
                            of position's value
                          </div>
                          <template v-if="fee?.description">
                            <q-separator :dark="darkMode"/>
                            <div>{{ fee?.description }}</div>
                          </template>
                        </div>
                      </q-popup-proxy>
                    </div>
                  </div>

                  <!-- Keeping this section for backward compabitibility -->
                  <div v-if="premiumFeeMetadata?.hedge?.pctg" class="row items-start q-pr-md">
                    <div class="text-caption text-grey row-items-center" style="margin-bottom:-0.5em">
                      Premium
                      <q-icon
                        v-if="premiumFeeMetadata?.hedge"
                        :color="premiumFeeMetadata?.hedge?.icon?.color"
                        :name="premiumFeeMetadata?.hedge?.icon?.name"
                        size="1.5em"
                      >
                        <q-popup-proxy :breakpoint="0">
                          <div :class="['q-px-md q-py-sm', darkMode ? 'pt-dark-label pt-dark' : 'text-black']">
                            Premium is 
                            <span :class="['text-weight-medium', `text-${premiumFeeMetadata?.hedge?.icon?.color}`]" style="word-break: keep-all;">
                              {{ formatUnits(premiumFeeMetadata?.hedge?.pctg, 2) }}%
                            </span>
                            of position's value
                          </div>
                        </q-popup-proxy>
                      </q-icon>
                    </div>
                    <div class="q-space text-right">{{ fundingAmounts?.hedge?.fees?.premium / (10**8) }} BCH</div>
                  </div>
                </div>
              </div>
            </q-slide-transition>
          </div>
          <div>
            <div
              class="row items-start q-pr-md"
              v-ripple style="position:relative;"
              @click="expandFundingAmounts.long = !expandFundingAmounts.long"
            >
              <div>
                <q-icon
                  name="arrow_right"
                  size="1.5em"
                  :style="{
                    transform: expandFundingAmounts.long ? 'rotate(90deg)' : '',
                    transition: 'transform 0.25s',
                  }"
                />
              </div>
              <div class="text-body1 text-grey">Long</div>
              <div class="q-space text-body1 text-right">{{ fundingAmounts?.long?.total / (10**8) }} BCH</div>
            </div>
            <q-slide-transition>
              <div v-if="expandFundingAmounts.long" class="q-pl-md">
                <div class="row items-start q-pr-md">
                  <div class="text-caption text-grey" style="margin-bottom:-0.5em">Contract</div>
                  <div class="q-space text-right">{{ fundingAmounts?.long?.sats / (10**8) }} BCH</div>
                </div>
                <div class="text-caption text-grey" style="margin-bottom:-0.5em">Fees</div>
                <div class="q-pl-md">
                  <div class="row items-start q-pr-md">
                    <div class="text-caption text-grey" style="margin-bottom:-0.5em">Network fee</div>
                    <div class="q-space text-right">{{ fundingAmounts?.long?.fees?.network / (10**8) }} BCH</div>
                  </div>
                  <div>
                    <div
                      v-for="(fee, index) in fundingAmounts?.long?.fees?.serviceFees" :key="index"
                      class="row items-start q-pr-md no-wrap"
                    >
                      <div class="text-caption text-grey ellipsis" style="margin-bottom:-0.5em">
                        <q-icon
                          v-if="fee?.stats?.pctg"
                          :color="fee?.stats?.icon?.color"
                          :name="fee?.stats?.icon?.name"
                          size="1.25em"
                        />
                        {{ fee?.name || ellipsisText(fee?.address) }}
                        <q-icon v-if="fee?.description" name="description"/>
                      </div>
                      <q-space/>
                      <div class="text-right q-ml-xs" style="white-space:nowrap">{{ fee?.satoshis / (10**8) }} BCH</div>
                      <q-popup-proxy v-if="fee?.description || fee?.stats?.pctg" :breakpoint="0">
                        <div :class="['q-px-md q-py-sm', darkMode ? 'pt-dark-label pt-dark' : 'text-black']">
                          <div v-if="fee?.name" class="text-subtitle1">{{ fee?.name }} </div>
                          <div v-if="fee?.stats?.pctg" class="text-caption" style="margin-top:-0.25em">
                            <span :class="['text-weight-medium', `text-${fee?.stats?.icon?.color}`]" style="word-break: keep-all;">
                              {{ formatUnits(fee?.stats?.pctg, 2) }}%
                            </span>
                            of position's value
                          </div>
                          <template v-if="fee?.description">
                            <q-separator :dark="darkMode"/>
                            <div>{{ fee?.description }}</div>
                          </template>
                        </div>
                      </q-popup-proxy>
                    </div>
                  </div>
                  <!-- Keeping this section for backward compabitibility -->
                  <div v-if="premiumFeeMetadata?.long?.pctg" class="row items-start q-pr-md">
                    <div class="text-caption text-grey" style="margin-bottom:-0.5em">
                      Premium
                      <q-icon
                        v-if="premiumFeeMetadata?.long"
                        :color="premiumFeeMetadata?.long?.icon?.color"
                        :name="premiumFeeMetadata?.long?.icon?.name"
                        size="1.5em"
                      >
                        <q-popup-proxy :breakpoint="0">
                          <div :class="['q-px-md q-py-sm', darkMode ? 'pt-dark-label pt-dark' : 'text-black']">
                            Premium is 
                            <span :class="['text-weight-medium', `text-${premiumFeeMetadata?.long?.icon?.color}`]" style="word-break: keep-all;">
                              {{ formatUnits(premiumFeeMetadata?.long?.pctg, 2) }}%
                            </span>
                            of position's value
                          </div>
                        </q-popup-proxy>
                      </q-icon>
                    </div>
                    <div class="q-space text-right">{{ fundingAmounts?.long?.fees?.premium / (10**8) }} BCH</div>
                  </div>
                </div>
              </div>
            </q-slide-transition>
          </div>
          <q-separator :dark="darkMode"/>
        </div>

        <div>
          <div class="text-grey text-subtitle1">Contract Duration</div>
          <div>
            <template v-if="durationData.startTimestamp">
              {{ formatTimestampToText(durationData.startTimestamp * 1000) }} -
              {{ formatTimestampToText(durationData.maturityTimestamp * 1000) }}
              ({{ formatDuration(durationData.duration) }})
            </template>
            <template v-else>
              {{ formatDuration(durationData.duration) }}
            </template>
          </div>
          <q-separator :dark="darkMode"/>
        </div>

        <div>
          <div class="text-grey text-subtitle1">Liquidation Parameters</div>
          <div>
            <div v-if="liquidationData.priceValue">
              <span class="text-caption text-grey">Start price:</span>
              <span class="q-ml-xs">
                {{ formatUnits(liquidationData.priceValue, oracleInfo?.assetDecimals || 0) }} {{ oracleInfo?.assetCurrency }}
              </span>
            </div>
            <div class="row">
              <div class="col-6">
                <div class="text-caption text-grey" style="margin-bottom:-0.5em">Low</div>
                <div>
                  <template v-if="liquidationData.priceValue">
                    {{ formatUnits(liquidationData.low.price, oracleInfo?.assetDecimals || 0) }}
                    <template v-if="oracleInfo?.assetCurrency">{{ oracleInfo.assetCurrency }}/BCH</template>
                    <template v-else="oracleInfo?.assetCurrency">units/BCH</template>
                  </template>
                  {{ liquidationData.priceValue ? `(${liquidationData.low.pctg}%)` : `${liquidationData.low.pctg}%` }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey" style="margin-bottom:-0.5em">High</div>
                <div>
                  <template v-if="liquidationData.priceValue">
                    {{ formatUnits(liquidationData.high.price, oracleInfo?.assetDecimals || 0) }}
                    <template v-if="oracleInfo?.assetCurrency">{{ oracleInfo.assetCurrency }}/BCH</template>
                    <template v-else="oracleInfo?.assetCurrency">units/BCH</template>
                  </template>
                  {{ liquidationData.priceValue ? `(${liquidationData.high.pctg}%)` : `${liquidationData.high.pctg}%` }}
                </div>
              </div>
            </div>
            <!-- {{ liquidationData }} -->
          </div>
          <q-separator :dark="darkMode"/>
        </div>

        <div>
          <div class="text-grey text-subtitle1">Payout addresses</div>
          <div v-if="!isPositionOffer || pubkeys.hedgeAddress" class="q-mb-xs">
            <div class="text-caption text-grey" style="margin-bottom:-0.5em;">Hedge:</div>
            <div class="q-space" style="word-break:break-all;">{{pubkeys.hedgeAddress}}</div>
          </div>
          <div v-if="!isPositionOffer || pubkeys.longAddress" class="q-mb-xs">
            <div class="text-caption text-grey" style="margin-bottom:-0.5em;">Long:</div>
            <div class="q-space" style="word-break:break-all;">{{pubkeys.longAddress}}</div>
          </div>
          <q-separator :dark="darkMode"/>
        </div>
      </q-card-section>
    </q-card>
    <q-list v-if="showSlider" class="absolute-bottom">
      <q-slide-item left-color="blue" @left="onSliderSwipe()">
        <template v-slot:left>
          <div style="font-size: 15px" class="text-body1">
          <q-icon class="material-icons q-mr-md" size="lg">
            task_alt
          </q-icon>
          Security Check
          </div>
        </template>

        <q-item class="bg-grad text-white q-py-md">
          <q-item-section avatar>
            <q-icon name="mdi-chevron-double-right" size="xl" class="bg-blue" style="border-radius: 50%" />
          </q-item-section>
          <q-item-section class="text-right">
            <h5 class="q-my-sm text-grey-4">SWIPE TO CONFIRM</h5>
          </q-item-section>
        </q-item>
      </q-slide-item>
    </q-list>
  </q-dialog>
</template>
<script setup>
import { calculateFundingAmountsWithFees, LIQUIDITY_FEE_NAME } from 'src/wallet/anyhedge/funding';
import { formatDuration, formatUnits, formatTimestampToText, ellipsisText } from 'src/wallet/anyhedge/formatters';
import { useDialogPluginComponent } from 'quasar';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';

// dialog plugins requirement
defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const store = useStore()
const darkMode = computed(() => store.getters['darkmode/getStatus'])

/**
 * 
 * @typedef {Object} IntentProp
 * @property {Number} amount
 * @property {Number} lowPriceMult
 * @property {Number} highPriceMult
 * @property {Number} duration
 * 
 * @typedef {Object} PubkeysProp
 * @property {String} hedgeAddress
 * @property {String} hedgePubkey
 * @property {String} hedgeAddressPath
 * @property {String} longAddress
 * @property {String} longPubkey
 * @property {String} longAddressPath
 * 
 * @typedef {Object} PriceDataProp
 * @property {String} [oraclePubkey]
 * @property {Number} [priceValue]
 * @property {Number} [messageTimestamp]
 * @property {Number} [messageSequence]
 * @property {String} [message]
 * @property {String} [signature]
 * 
 * @typedef {Object} FundingProp
 * @property {Number} liquidityFee
 * @property {Object} [fee]
 * @property {String} fee.address
 * @property {Number} fee.satoshis
 * 
 * @typedef {Object} OracleInfoProp
 * @property {String} [oraclePubkey]
 * @property {String} [assetName]
 * @property {Number} [assetDecimals]
 * @property {String} [assetCurrency]
 * 
*/
const props = defineProps({
  /** @type {IntentProp} */
  intent: Object,
  /** @type {PubkeysProp} */
  pubkeys: Object,
  /** @type {PriceDataProp} */
  priceData: Object,
  /** @type {FundingProp} */
  funding: Object,
  /** @type {OracleInfoProp} */
  oracleInfo: Object,

  position: String,
  positionTaker: String,
  isPositionOffer: Boolean,
})
const showSlider = ref(false)
onMounted(() => {
  setTimeout(() => {
    showSlider.value = true
  }, 300)
})
function onSliderSwipe() {
  showSlider.value = false
  setTimeout(() => onDialogOK(), 150)
}

const expandContractValues = ref(false)
const contractValues = computed(() => {
  const data = {
    priceValue: 0,
    hedge: { nominalUnits: 0, satoshis: 0 },
    long: { nominalUnits: 0, satoshis: 0 },
  }

  data.hedge.satoshis = props.intent.amount * 10 ** 8
  if (!props.isPositionOffer) data.priceValue = props.priceData?.priceValue
  if (data.priceValue) {
    data.hedge.nominalUnits = data.hedge.satoshis * data.priceValue

    const lowPrice = Math.floor(props.intent.lowPriceMult * data.priceValue)
    data.long.satoshis = Math.round((data.hedge.nominalUnits / lowPrice) -  data.hedge.satoshis)
    data.long.nominalUnits = data.long.satoshis * data.priceValue
  } else {
    data.long.satoshis = Math.round((data.hedge.satoshis / props.intent.lowPriceMult) - data.hedge.satoshis)
  }

  data.hedge.nominalUnits = Math.round(data.hedge.nominalUnits / 10 ** 8)
  data.long.nominalUnits = Math.round(data.long.nominalUnits / 10 ** 8)

  return data
})

const fundingAmounts = ref(null)
const expandFundingAmounts = ref({ hedge: false, long: false })
onMounted(() => {
  expandFundingAmounts.value.hedge = props.position === 'hedge'
  expandFundingAmounts.value.long = props.position === 'long'
})
watch(() => [props.position], () => {
  expandFundingAmounts.value.hedge = props.position === 'hedge'
  expandFundingAmounts.value.long = props.position === 'long'
})
function updateFundingAmounts() {
  calculateFundingAmountsWithFees({
    amountSats: props.intent.amount * 10 ** 8,
    startingOracleMessage: props.priceData.message,
    startingOracleSignature: props.priceData.signature,
    lowLiquidationMultiplier: props.intent.lowPriceMult,
    startingPriceValue: props.priceData.priceValue,
    hedgeAddress: props.pubkeys.hedgeAddress,
    longAddress: props.pubkeys.longAddress,
    fees: props.funding?.fees,
    liquidityFee: props.funding.liquidityFee,
    position: props.positionTaker || props.position,
  })
    .then(newFundingAmounts => {
      if (Array.isArray(newFundingAmounts?.hedge?.fees?.serviceFees)) {
        attachFeeStats(newFundingAmounts?.hedge)
      }
      if (Array.isArray(newFundingAmounts?.long?.fees?.serviceFees)) {
        attachFeeStats(newFundingAmounts?.long)
      }
      fundingAmounts.value = newFundingAmounts
    })
    .catch((error) => {
      console.error(error)
      fundingAmounts.value = null
    })
}

function attachFeeStats({ sats, fees={ serviceFees }}) {
  if (!Array.isArray(fees?.serviceFees)) return
  fees.serviceFees.forEach(fee => {
    if (fee?.name !== LIQUIDITY_FEE_NAME) return
    fee.stats = parsePremiumFee({sats, fees: { premium: fee.satoshis }})
  })
}

// watch(props, updateFundingAmounts())
onMounted(() => updateFundingAmounts())
const premiumFeeMetadata = computed(() => {
  if (!fundingAmounts.value) return
  return {
    hedge: parsePremiumFee(fundingAmounts.value.hedge),
    long: parsePremiumFee(fundingAmounts.value.long),
  }
})
function parsePremiumFee({ sats, fees={ premium } }) {
  const data = { pctg: 0, icon: { color: '', name: '' } }
  if (sats && fees?.premium) data.pctg = (fees?.premium / sats) * 100

  if (data.pctg <= 1) data.icon = { color: 'green', name: 'gpp_good' }
  if (data.pctg > 1 && data.pctg <= 5) data.icon = { color: 'yellow', name: 'gpp_maybe' }
  if (data.pctg > 5 && data.pctg <= 10) data.icon = { color: 'amber', name: 'gpp_maybe' }
  if (data.pctg > 10) data.icon = { color: 'red', name: 'gpp_maybe' }

  data.pctg = data.pctg * 100
  return data
}

const liquidationData = computed(() => {
  const data = {
    priceValue: 0,
    low: { pctg: 0, price: 0 },
    high: { pctg: 0, price: 0 },
  }

  if (!props.isPositionOffer) data.priceValue = props.priceData?.priceValue
  data.low.pctg = props.intent.lowPriceMult
  data.high.pctg = props.intent.highPriceMult
  if (data.priceValue) {
    data.low.price = data.low.pctg * data.priceValue
    data.high.price = data.high.pctg * data.priceValue
  }
  data.low.pctg *= 100
  data.high.pctg *= 100

  return data
})

const durationData = computed(() => {
  const data = {
    duration: props.intent.duration,
    startTimestamp: 0,
    maturityTimestamp: 0,
  }

  if (props.priceData?.messageTimestamp && !props.isPositionOffer) {
    data.startTimestamp = props.priceData.messageTimestamp
    data.maturityTimestamp = data.startTimestamp + data.duration
  }

  return data
})
window.p = props
window.t = updateFundingAmounts
</script>
