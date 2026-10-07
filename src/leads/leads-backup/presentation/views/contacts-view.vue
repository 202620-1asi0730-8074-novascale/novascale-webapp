<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import { useLeadsStore } from '../../application/leads.store.js'
import { useConversationsStore } from '../../../conversations/application/conversations.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
function filterContacts(contacts, query = '', type = 'all') {
    const term = normalize(query)
    return contacts.filter(c => (type === 'all' || c.type === type) && normalize(`${c.name} ${c.company} ${c.email} ${c.phone}`).includes(term))
}

const props = defineProps({ search: String, leads: Boolean })
const store = useLeadsStore()
const conversationsStore = useConversationsStore()
const router = useRouter()
const { t } = useI18n()

onMounted(() => { if (!store.contacts.length) store.fetchContacts() })

const filtered = computed(() => filterContacts(store.contacts, props.search, props.leads ? 'lead' : 'customer'))

function openChat(contactId) {
  conversationsStore.activeContactId = contactId;
  router.push('/conversations')
}
</script>

<template>
  <div class="page-heading">
    <div><h1>{{ t(leads ? 'leadDirectory' : 'customerDirectory') }}</h1></div>
    <button class="button primary" @click="store.leadEditor = { open: true, contact: null, stage: 'new', type: leads ? 'lead' : 'customer' }"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('plus')" :style="{ width: 17 + 'px', height: 17 + 'px' }"></span>{{ t(leads ? 'addLead' : 'addCustomer') }}</button>
  </div>
  <section class="panel directory-panel">
    <div class="table-scroll">
      <table>
        <thead><tr><th>{{ t('name') }}</th><th>{{ t('company') }}</th><th>{{ t('tableEmail') }}</th><th>{{ t('phone') }}</th><th>{{ t('stage') }}</th><th>{{ t('actions') }}</th></tr></thead>
        <tbody>
        <tr v-for="contact in filtered" :key="contact.id">
          <td :data-label="t('name')"><button class="contact-name" @click="openChat(contact.id)"><UserAvatar :name="contact.name" /><strong>{{ contact.name }}</strong></button></td>
          <td :data-label="t('company')">{{ contact.company }}</td>
          <td :data-label="t('tableEmail')">{{ contact.email }}</td>
          <td :data-label="t('phone')">{{ contact.phone || '—' }}</td>
          <td :data-label="t('stage')"><span class="badge" :class="contact.type === 'customer' ? 'green' : 'blue'">{{ t(contact.type === 'customer' ? 'customer' : 'lead') }}</span></td>
          <td :data-label="t('actions')">
            <div class="table-actions">
              <button :aria-label="t('conversation')" class="icon-button compact" @click="openChat(contact.id)"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('chat')" :style="{ width: 20 + 'px', height: 20 + 'px' }"></span></button>
              <button :aria-label="t('editContact')" class="icon-button compact" @click="store.leadEditor = { open: true, contact }"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('edit')" :style="{ width: 20 + 'px', height: 20 + 'px' }"></span></button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
      <p v-if="!filtered.length" class="empty-state">{{ t('noContacts') }}</p>
    </div>
    <div class="mobile-contact-list">
      <article v-for="contact in filtered" :key="contact.id" class="mobile-contact-card">
        <button class="mobile-contact-main" @click="openChat(contact.id)"><UserAvatar :name="contact.name" /><span><strong>{{ contact.name }}</strong><small>{{ contact.company }}</small></span></button>
        <div class="mobile-contact-foot"><span>{{ contact.email }}</span><span class="badge" :class="contact.type === 'customer' ? 'green' : 'blue'">● {{ t(contact.type === 'customer' ? 'customer' : 'lead') }}</span></div>
        <button class="mobile-contact-edit" :aria-label="t('editContact')" @click="store.leadEditor = { open: true, contact }">{{ t('editContact') }}</button>
      </article>
      <p v-if="!filtered.length" class="empty-state">{{ t('noContacts') }}</p>
    </div>
  </section>
</template>
