<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from './shared/application/ui.store.js'
import { useLeadsStore } from './leads/application/leads.store.js'
import AppShell from './shared/presentation/components/app-shell.vue'
import LeadForm from './leads/presentation/components/lead-form.vue'
import { useI18n } from './i18n.js'

const route = useRoute()
const uiStore = useUiStore()
const leadsStore = useLeadsStore()
const { t } = useI18n()
const search = ref('')

const isAuth = computed(() => ['login', 'signup', 'forgot-password'].includes(route.name))
const isPricing = computed(() => route.name === 'pricing')
const isNotFound = computed(() => route.name === 'not-found')

watch(route, () => { window.scrollTo(0, 0); leadsStore.leadEditor.open = false; search.value = '' })
</script>

<template>
  <router-view v-if="isAuth || isPricing || isNotFound" />
  <AppShell v-else v-model:search="search">
    <router-view :search="search" />
  </AppShell>

  <LeadForm v-if="leadsStore.leadEditor.open" />

  <Transition name="toast">
    <div v-if="uiStore.toast" class="toast" role="status">
      <span class="toast-icon"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('check')" :style="{ width: 18 + 'px', height: 18 + 'px' }"></span></span>
      {{ uiStore.toast }}
      <button :aria-label="t('closeNotice')" @click="uiStore.toast = ''"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('close')" :style="{ width: 16 + 'px', height: 16 + 'px' }"></span></button>
    </div>
  </Transition>
</template>
