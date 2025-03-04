<template>
  <q-dialog ref="dialog" @hide="onDialogHide" full-width>
    <q-card :class="darkMode ? 'pt-dark' : 'text-black'">
      <div class="row no-wrap items-center justify-center q-pl-md">
        <div class="text-subtitle1 q-space">{{ $t('SelectToken') }}</div>
        <q-btn
          flat
          padding="sm"
          icon="close"
          v-close-popup
        />
      </div>
      <q-card-section>
        <q-input dense outlined v-model="searchText" :input-class="darkMode ? 'text-white' : 'text-black'"/>
      </q-card-section>
      <q-card-section style="max-height:50vh;overflow-y:auto;" class="q-pt-none">
        <q-virtual-scroll :items="filteredTokensList">
          <template v-slot="{ item: token, index }">
            <q-item clickable @click="onOKClick(token)">
              <q-item-section avatar>
                <img v-if="token.image_url" :src="token.image_url" height="30" class="q-mr-xs">
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ token.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  name: 'SpicebotBridgeTokenSelectDialog',
  emits: [
    // REQUIRED
    'ok', 'hide'
  ],
  props: {
    tokens: {
      type: Array
    },
    darkMode: {
      type: Boolean,
      defualt: false
    }
  },

  data () {
    return {
      searchText: ''
    }
  },

  computed: {
    filteredTokensList () {
      if (!this.searchText) return this.tokens

      const needle = String(this.searchText).toLowerCase()
      return this.tokens.filter(token =>
        String(token.name).toLowerCase().includes(needle)
      )
    }
  },

  methods: {
    // following method is REQUIRED
    // (don't change its name --> "show")
    show () {
      this.$refs.dialog.show()
    },

    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide () {
      this.$refs.dialog.hide()
    },

    onDialogHide () {
      // required to be emitted
      // when QDialog emits "hide" event
      this.$emit('hide')
    },

    onOKClick (token) {
      // on OK, it is REQUIRED to
      // emit "ok" event (with optional payload)
      // before hiding the QDialog
      this.$emit('ok', token)
      // or with payload: this.$emit('ok', { ... })

      // then hiding dialog
      this.hide()
    },

    onCancelClick () {
      // we just need to hide dialog
      this.hide()
    }
  }
}
</script>
