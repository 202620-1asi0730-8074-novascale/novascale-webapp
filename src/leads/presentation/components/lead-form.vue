<script setup>
import { reactive, watch } from 'vue'
import AppModal from '../../../shared/presentation/components/app-modal.vue'
import { useLeadsStore } from '../../application/leads.store.js'
import { useI18n } from '../../../i18n.js'

const store = useLeadsStore()
const { t } = useI18n()
const form = reactive({ id: null, name: '', company: '', email: '', phone: '', source: '', value: 0, stage: 'new', type: 'lead' })

watch(() => store.leadEditor.open, (isOpen) => {
  if (isOpen) {
    const contact = store.leadEditor.contact
    Object.assign(form, contact ? { ...contact } : { id: null, name: '', company: '', email: '', phone: '', source: '', value: 0, stage: store.leadEditor.stage || 'new', type: store.leadEditor.type || 'lead' })
  }
}, { immediate: true })

async function submit() {
  try { await store.saveContact({ ...form }) } catch { /* The store shows the API error. */ }
}
</script>
<template>
  <AppModal :title="t(form.id ? 'editContact' : form.type === 'customer' ? 'newCustomer' : 'newLead')" @close="store.leadEditor.open = false">
    <form @submit.prevent="submit">
      <div class="modal-body form-stack">
        <label>{{ t('name') }}<input v-model="form.name" required :placeholder="t('name')" /></label>
        <label>{{ t('company') }}<input v-model="form.company" required :placeholder="t('company')" /></label>
        <label class="lead-type-field">{{ t('contactType') }}<select v-model="form.type"><option value="lead">{{ t('lead') }}</option><option value="customer">{{ t('customer') }}</option></select></label>
        <div class="form-grid">
          <label>{{ t('email') }}<input v-model="form.email" required type="email" placeholder="name@company.com" /></label>
          <label class="lead-phone-field">{{ t('phone') }}<input v-model="form.phone" type="tel" /></label>
        </div>
        <label class="lead-source-field">{{ t('leadSource') }}<select v-model="form.source"><option value="">{{ t('selectSource') }}</option><option value="web">{{ t('sourceWeb') }}</option><option value="referral">{{ t('sourceReferral') }}</option><option value="other">{{ t('sourceOther') }}</option></select></label>
        <label>{{ t('estimatedValue') }}<input v-model="form.value" type="number" min="0" placeholder="0.00" /></label>
        <label>{{ t('stage') }}<select v-model="form.stage"><option value="new">{{ t('newStage') }}</option><option value="contacted">{{ t('contactedStage') }}</option><option value="proposal">{{ t('proposalStage') }}</option><option value="won">{{ t('wonStage') }}</option></select></label>
      </div>
      <div class="modal-footer">
        <button class="button secondary" type="button" @click="store.leadEditor.open = false">{{ t('cancel') }}</button>
        <button class="button primary" type="submit">{{ t('save') }}</button>
      </div>
    </form>
  </AppModal>
</template>
