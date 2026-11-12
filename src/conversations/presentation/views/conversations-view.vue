<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { apiErrorMessage } from '../../../shared/infrastructure/base-api.js'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import { useConversationsStore } from '../../application/conversations.store.js'
import { useLeadsStore } from '../../../leads/application/leads.store.js'
import { useI18n, money } from '../../../i18n.js'
import { useUiStore } from '../../../shared/application/ui.store.js'

const props = defineProps({ search: String })
const store = useConversationsStore()
const leadsStore = useLeadsStore()
const uiStore = useUiStore()
const { locale, t } = useI18n()

const draft = ref('')
const sending = ref(false)
const attachments = ref([])
const fileInput = ref(null)
const emojiOpen = ref(false)
const detailsOpen = ref(false)
const now = ref(Date.now())
let clock
onMounted(() => { clock = window.setInterval(() => { now.value = Date.now() }, 30000) })
onBeforeUnmount(() => window.clearInterval(clock))
const pendingMinutes = computed(() => {
  if (!store.pendingSince) return null
  const date = Date.parse(store.pendingSince)
  return Number.isFinite(date) ? Math.max(0, Math.floor((now.value - date) / 60000)) : null
})
async function attach(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    if (attachments.value.length >= 3 || file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'].includes(file.type)) { uiStore.notify(t('attachmentLimit')); continue }
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) }).catch(() => null)
    if (data) attachments.value.push({ name: file.name, type: file.type, data })
  }
  event.target.value = ''
}
const feed = ref(null)

function checkContact() {
  if (!leadsStore.contacts.some(c => c.id === store.activeContactId)) {
    store.activeContactId = leadsStore.contacts[0]?.id || null;
  }
}
watch(() => leadsStore.contacts.map(c => c.id), checkContact, { immediate: true })

const contact = computed(() => leadsStore.contacts.find(c => c.id === store.activeContactId))

watch(() => store.activeContactId, (newId) => {
  draft.value = ''
  attachments.value = []
  store.fetchMessages(newId)
}, { immediate: true })

function messageTime(message) {
  const date = /^\d{4}-\d{2}-\d{2}T/.test(message.sentAt || '') ? new Date(message.sentAt) : null
  return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'es-PE', { hour: '2-digit', minute: '2-digit' }).format(date) : message.time
}

async function scrollBottom() { await nextTick(); if (feed.value) feed.value.scrollTop = feed.value.scrollHeight }
watch(() => store.messages.length, scrollBottom)

async function send() {
  if ((!draft.value.trim() && !attachments.value.length) || !store.activeContactId || sending.value || store.loading) return;
  const contactId = store.activeContactId
  const text = draft.value
  sending.value = true
  try {
    await store.sendMessage(text, [...attachments.value])
    if (store.activeContactId === contactId && draft.value === text) { draft.value = ''; attachments.value = [] }
  } catch (error) {
    uiStore.notify(apiErrorMessage(error, 'sendFailed'))
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="page-heading">
    <div><h1>{{ t('conversations') }}</h1></div>
  </div>
  <div class="conversation-selector">
    <label>{{ t('contact') }}
      <select v-model="store.activeContactId" :disabled="sending">
        <option v-for="c in leadsStore.contacts" :key="c.id" :value="c.id">{{ c.name }} · {{ c.company }}</option>
      </select>
    </label>
    <button v-if="contact" class="button secondary small contact-detail-toggle" :aria-expanded="detailsOpen" aria-controls="conversation-contact" @click="detailsOpen = !detailsOpen">{{ t(detailsOpen ? 'hideContactDetails' : 'contactDetails') }}</button>
  </div>
  <div v-if="contact" class="conversation-layout">
    <aside id="conversation-contact" class="panel contact-detail" :class="{ 'is-open': detailsOpen }">
      <UserAvatar :name="contact.name" size="xl" />
      <h2>{{ contact.name }}</h2>
      <p>{{ contact.company }}</p>
      <span class="badge green">{{ t(contact.type === 'customer' ? 'customer' : 'lead') }}</span>
      <div class="tag-list"><span v-for="tag in contact.tags" :key="tag" class="badge violet">{{ tag }}</span></div>
      <p>{{ t('owner') }}: {{ contact.owner }}</p>
      <button class="button secondary small" @click="leadsStore.leadEditor = { open: true, contact }">{{ t('editContact') }}</button>
      <div class="contact-detail-facts"><div><small>{{ t('estimatedValue') }}</small><strong>{{ money(contact.value) }}</strong></div><div><small>{{ t('email') }}</small><span>{{ contact.email }}</span></div><div><small>{{ t('phone') }}</small><span>{{ contact.phone || '—' }}</span></div></div>
    </aside>

    <section class="panel chat-panel">
      <div class="chat-heading">
        <span class="whatsapp-icon"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('chat')" :style="{ width: 24 + 'px', height: 24 + 'px' }"></span></span>
        <div><h2>{{ contact.name }}</h2><p class="chat-contact-status"><span class="status-dot green"></span>{{ contact.company }}</p></div>
        <span v-if="pendingMinutes !== null && pendingMinutes >= 120" class="badge red chat-priority">{{ t('highPriority') }}</span>
      </div>
      <p v-if="pendingMinutes !== null" class="pending-label" role="status">{{ t(pendingMinutes === 1 ? 'pendingReplyMinute' : 'pendingReply', { minutes: pendingMinutes }) }}</p>
      <div ref="feed" class="chat-feed">
        <p v-if="store.loading" class="empty-state" role="status">{{ t('loading') }}</p>
        <div v-else-if="!store.messages.length" class="empty-state">
          <p>{{ t('noMessages') }}</p>
        </div>
        <div v-for="message in store.messages" :key="message.id" class="message-row" :class="message.direction">
          <div class="message-stack"><div class="message-bubble"><p v-if="message.text">{{ message.text }}</p><a v-for="file in message.attachments" :key="file.name" :href="file.data" :download="file.name">📎 {{ file.name }}</a></div><small v-if="message.time">{{ messageTime(message) }}</small></div>
        </div>
      </div>
      <div v-if="attachments.length" class="attachment-list"><span v-for="(file, index) in attachments" :key="index">{{ file.name }}<button :aria-label="t('removeAttachment')" :disabled="sending" @click="attachments.splice(index, 1)">×</button></span></div>
      <div v-if="emojiOpen" class="emoji-list"><button v-for="emoji in ['😀', '👍', '😊', '🎉', '✅', '🙏']" :key="emoji" :aria-label="emoji" @click="draft += emoji; emojiOpen = false">{{ emoji }}</button></div>
      <form class="message-composer" @submit.prevent="send">
        <input ref="fileInput" type="file" hidden multiple accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" @change="attach" />
        <button type="button" class="icon-button compact" :aria-label="t('attachFile')" :disabled="sending" @click="fileInput.click()">📎</button><button type="button" class="icon-button compact" :aria-label="t('emojis')" :disabled="sending" :aria-expanded="emojiOpen" @click="emojiOpen = !emojiOpen">☺</button>
        <label class="message-input"><input v-model="draft" :aria-label="t('writeMessage')" :placeholder="t('writeMessage')" :disabled="sending || store.loading" /></label>
        <button class="button primary" type="submit" :disabled="sending || store.loading || (!draft.trim() && !attachments.length)">{{ t(sending ? 'sending' : 'send') }}</button>
      </form>
    </section>
  </div>
  <p v-else class="empty-state">{{ t('noContacts') }}</p>
</template>
