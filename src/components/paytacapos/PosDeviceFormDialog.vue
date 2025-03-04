<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading" full-width>
    <q-card :class="darkMode ? 'pt-dark' : 'text-black'" class="br-15">
      <div class="row no-wrap items-center justify-center q-pl-md q-py-sm">
        <div class="text-h6 q-space q-mt-sm">
          <template v-if="newDevice">
            {{ $t('AddNewDevice', {}, 'Add new device') }}
          </template>
          <template v-else>
            {{ $t('UpdateDeviceIDNo', { ID: padPosId(posDevice?.posid) }, `Update device #${padPosId(posDevice?.posid)}`) }}
          </template>
        </div>
        <q-btn
          flat
          padding="sm"
          icon="close"
          v-close-popup
        />
      </div>
      <q-card-section>
        <q-form @submit="savePosDevice()" class="q-gutter-y-sm">
          <q-input
            outlined
            dense
            label="Device name"
            :disable="loading"
            :dark="darkMode"
            v-model="posDeviceForm.name"
            :rules="[
              val => Boolean(val) || $t('Required', {}, 'Required'),
            ]"
          />
          <q-select
            outlined
            dense
            label="Branch"
            :disable="loading"
            :dark="darkMode"
            :options="branchOpts"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            clearable
            :popup-content-class="darkMode ? '': 'text-black'"
            v-model="posDeviceForm.branchId"
            popup-content-style="color: black;"
          />
          <div v-if="loading" class="text-center q-mt-md">
            <template v-if="newDevice">
              {{$t('AddingNewDevice', {}, 'Adding new device')}}
            </template>
            <template v-else>
              {{$t('UpdatingDeviceIDNo', {ID: padPosId(posDevice?.posid)}, `Updating device #${padPosId(posDevice?.posid)}`)}}
            </template>
            <q-spinner size="1.5em" class="q-ml-xs"/>
          </div>
          <div class="row items-center justify-end q-mt-md">
            <q-btn
              flat
              :disable="loading"
              color="brandblue"
              :label="$t('Cancel', {}, 'Cancel')"
              @click="onDialogCancel"
            />
            <q-btn
              flat
              type="submit"
              :disable="loading"
              color="brandblue"
              :label="newDevice ? $t('Create', {}, 'Create') : $t('Update', {}, 'Update')"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup>
import { backend as posBackend, padPosId } from 'src/wallet/pos'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n'

// dialog plugins requirement
const emit = defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const $q = useQuasar()
const $store = useStore()
const $t = useI18n().t
const darkMode = computed(() => $store.getters['darkmode/getStatus'])

const props = defineProps({
  newDevice: Boolean,
  posDevice: Object,
  branchOptions: Array,
})

const walletType = 'bch'
const walletData = computed(() => {
  const _walletData = $store.getters['global/getWallet'](walletType)
  // extract necessary data
  const data = {
    walletHash: _walletData?.walletHash,
    xPubKey: _walletData?.xPubKey,
  }

  // Object.assign to pass all other data that might come in handy
  Object.assign(data, _walletData)
  return data
})

const loading = ref(false)
const posDeviceForm = ref({
  name: '',
  branchId: null,
})
const branchOpts = computed(() => {
  let opts = []
  if (Array.isArray(props.branchOptions)) opts.push.apply(opts, props.branchOptions)
  return opts
})
onMounted(() => resetForm())
function resetForm(opts={ clear: false }) {
  if (opts?.clear) {
    posDeviceForm.value.name = ''
    posDeviceForm.value.branchId = null
    return
  }
  posDeviceForm.value.name = props.posDevice?.name || ''
  posDeviceForm.value.branchId = props.posDevice?.branchId || null
}

function savePosDevice() {
  const data = Object.assign({
    wallet_hash: props.posDevice?.walletHash || walletData?.value?.walletHash,
    branch_id: posDeviceForm.value.branchId,
  }, posDeviceForm.value)
  if (!props.newDevice) data.posid = props.posDevice?.posid
  else data.posid = -1

  loading.value = true
  const apiRequest = posBackend.post(`/paytacapos/devices/`, data)
    .finally(() => {
      loading.value = false
    })

  onDialogOK(apiRequest)
}
</script>
