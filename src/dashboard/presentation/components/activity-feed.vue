<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '../../application/dashboard.store.js'
import { useConversationsStore } from '../../../conversations/application/conversations.store.js'
import { useAuthenticationStore } from '../../../authentication/application/authentication.store.js'
import { useI18n } from '../../../i18n.js'
import { money } from '../../../i18n.js'
import { activityDetails } from '../../application/dashboard.store.js'

const store = useDashboardStore()
const convStore = useConversationsStore()
const authStore = useAuthenticationStore()
const router = useRouter()
const { locale, t } = useI18n()

const eventKeys = { lead_created: 'leadCreated', customer_created: 'customerCreated', contact_updated: 'contactUpdated', stage_changed: 'stageChanged', followupScheduled: 'followupScheduled', dealWon: 'dealWon' }
function heading(item) { return eventKeys[item.eventType] ? t(eventKeys[item.eventType], { name: item.contactName }) : item.title }
function time(item) { return item.createdAt ? new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt)) : t('demoActivity') }

watch(() => authStore.profile?.id, id => {
  if (id) store.fetchActivities()
  else store.reset()
}, { immediate: true })

function open(item) {
  if (item.contactId) {
    convStore.activeContactId = item.contactId;
    router.push('/conversations')
  }
}
</script>
<template>
  <div class="activity-feed">
    <p v-if="!store.activities.length" class="empty-state">{{ t('noActivity') }}</p>
    <button v-for="item in store.activities" :key="item.id" class="activity-item" @click="open(item)">
      <span class="activity-icon" :class="item.eventType === 'customer_created' ? 'green' : item.color"><span class="ui-icon" aria-hidden="true" :class="'icon-' + (item.eventType ? 'users' : item.icon)" :style="{ width: 17 + 'px', height: 17 + 'px' }"></span></span>
      <span class="activity-copy">
        <span class="activity-heading"><strong>{{ heading(item) }}</strong><small>{{ time(item) }}</small></span>
        <span v-for="(detail, index) in activityDetails(item, { t, money })" :key="index" class="activity-change">{{ detail }}</span>
      </span>
    </button>
  </div>
</template>
