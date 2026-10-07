<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import { useConversationsStore } from '../../application/conversations.store.js'
import { useLeadsStore } from '../../../leads/application/leads.store.js'
import { useI18n, money } from '../../../i18n.js'

const props = defineProps({ search: String })
const store = useConversationsStore()
const leadsStore = useLeadsStore()
const router = useRouter()
const { t } = useI18n()

const draft = ref('')
const feed = ref(null)

function checkContact() {
  if (!leadsStore.contacts.some(c => c.id === store.activeContactId)) {
    store.activeContactId = leadsStore.contacts[0]?.id || null;
  }
}
watch(() => leadsStore.contacts, checkContact, { immediate: true })

const contact = computed(() => leadsStore.contacts.find(c => c.id === store.activeContactId))

watch(() => store.activeContactId, (newId) => {
  if (newId) store.fetchMessages(newId)
}, { immediate: true })

async function scrollBottom() { await nextTick(); if (feed.value) feed.value.scrollTop = feed.value.scrollHeight }
watch(() => store.messages.length, scrollBottom)

function send() {
  if (!draft.value.trim() || !store.activeContactId) return;
  store.sendMessage(draft.value).catch(console.error);
  draft.value = '';
}
</script>

<template>
  <div class="page-heading">
    <div><h1>{{ t('conversations') }}</h1></div>
  </div>
  <div class="conversation-selector">
    <label>{{ t('contact') }}
      <select v-model="store.activeContactId">
        <option v-for="c in leadsStore.contacts" :key="c.id" :value="c.id">{{ c.name }} · {{ c.company }}</option>
      </select>
    </label>
  </div>
  <div v-if="contact" class="conversation-layout">
    <aside class="panel contact-detail">
      <UserAvatar :name="contact.name" size="xl" />
      <h2>{{ contact.name }}</h2>
      <p>{{ contact.company }}</p>
      <span class="badge green">{{ t(contact.type === 'customer' ? 'customer' : 'lead') }}</span>
      <div class="contact-detail-facts"><div><small>{{ t('estimatedValue') }}</small><strong>{{ money(contact.value) }}</strong></div><div><small>{{ t('email') }}</small><span>{{ contact.email }}</span></div><div><small>{{ t('phone') }}</small><span>{{ contact.phone || '—' }}</span></div></div>
    </aside>

    <section class="panel chat-panel">
      <div class="chat-heading">
        <span class="whatsapp-icon"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('chat')" :style="{ width: 24 + 'px', height: 24 + 'px' }"></span></span>
        <div><h2>{{ contact.name }}</h2><p class="chat-contact-status"><span class="status-dot green"></span>{{ contact.company }}</p></div>
        <span v-if="contact.priority === 'Alta' || contact.priority === 'High'" class="badge red chat-priority">{{ t('highPriority') }}</span>
      </div>
      <div ref="feed" class="chat-feed">
        <div v-if="!store.messages.length" class="empty-state">
          <p>{{ t('noMessages') }}</p>
        </div>
        <div v-for="message in store.messages" :key="message.id" class="message-row" :class="message.direction">
          <div class="message-stack"><div class="message-bubble"><p>{{ message.text }}</p></div><small v-if="message.time">{{ message.time }}</small></div>
        </div>
      </div>
      <form class="message-composer" @submit.prevent="send">
        <label class="message-input"><input v-model="draft" :placeholder="t('writeMessage')" /></label>
        <button class="button primary" type="submit">{{ t('send') }}</button>
      </form>
    </section>
  </div>
</template>
