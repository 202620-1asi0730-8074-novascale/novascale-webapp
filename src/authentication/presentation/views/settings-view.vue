<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import { useAuthenticationStore } from '../../application/authentication.store.js'
import { useI18n } from '../../../i18n.js'

// Añadimos defineProps para evitar el warning amarillo
defineProps({ search: String })
const store = useAuthenticationStore()
const { t } = useI18n()
const tab = ref('users')
const draft = reactive({ name: '', company: '', quota: 0 })
const message = ref('')
const saving = ref(false)
const credentials = reactive({ currentPassword: '', newPassword: '' })
const passwordMessage = ref('')
const savingPassword = ref(false)

onMounted(() => {
  if (!store.users.length) store.fetchUsers().catch(console.error)
})
watch(() => store.profile, profile => {
  if (profile) Object.assign(draft, { name: profile.name, company: profile.company, quota: profile.quota })
}, { immediate: true })

async function save() {
  message.value = ''
  saving.value = true
  try {
    await store.updateProfile({ name: draft.name.trim(), company: draft.company.trim(), quota: Number(draft.quota) || 0 })
    message.value = t('profileSaved')
  } catch {
    message.value = t('profileFailed')
  } finally {
    saving.value = false
  }
}
async function savePassword() {
  passwordMessage.value = ''
  savingPassword.value = true
  try {
    await store.changePassword(credentials.currentPassword, credentials.newPassword)
    credentials.currentPassword = ''
    credentials.newPassword = ''
    passwordMessage.value = t('passwordChanged')
  } catch (error) {
    passwordMessage.value = error.response?.status === 401 ? t('invalidCredentials') : t('passwordChangeFailed')
  } finally { savingPassword.value = false }
}
</script>
<template>
  <div class="page-heading">
    <div><h1>{{ t('settings') }}</h1></div>
  </div>
  <section class="panel settings-panel">
    <div class="settings-top">
      <div class="tabs">
        <button :class="{ active: tab === 'users' }" @click="tab = 'users'">{{ t('teamPermissions') }}</button>
        <button :class="{ active: tab === 'profile' }" @click="tab = 'profile'">{{ t('myProfile') }}</button>
      </div>
    </div>
    <div id="settings-content">
      <template v-if="tab === 'users'">
        <div class="table-scroll">
          <table class="users-table">
            <thead><tr><th>{{ t('name') }}</th><th>{{ t('email') }}</th><th>{{ t('role') }}</th></tr></thead>
            <tbody>
            <tr v-for="user in store.users" :key="user.id">
              <td :data-label="t('name')"><UserAvatar :name="user.name" /><strong>{{ user.name }}</strong></td>
              <td :data-label="t('email')">{{ user.email }}</td>
              <td :data-label="t('role')">{{ user.role === 'Vendedor' ? t('sellerRole') : user.role === 'Director de ventas' ? t('directorRole') : user.role }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="mobile-users-list">
          <p class="mobile-section-label">{{ t('usersLabel') }}</p>
          <article v-for="user in store.users" :key="user.id" class="mobile-user-card">
            <div class="mobile-user-heading"><UserAvatar :name="user.name" /><div><strong>{{ user.name }}</strong><small>{{ user.email }}</small></div></div>
            <div class="mobile-user-role"><span>{{ t('role') }}</span><strong>{{ user.role === 'Vendedor' ? t('sellerRole') : user.role === 'Director de ventas' ? t('directorRole') : user.role }}</strong></div>
          </article>
          <p class="mobile-section-label">{{ t('productTags') }}</p>
          <div class="mobile-tags-card"><span v-for="tag in store.profile?.tags || []" :key="tag" class="badge violet">{{ tag }}</span><span v-if="!store.profile?.tags?.length" class="muted">{{ t('noTags') }}</span></div>
        </div>
      </template>
      <form v-else class="settings-body profile-form form-stack" @submit.prevent="save">
        <div class="form-grid">
          <label>{{ t('name') }}<input v-model="draft.name" required /></label>
          <label>{{ t('company') }}<input v-model="draft.company" required /></label>
          <label>{{ t('quota') }}<input v-model="draft.quota" required type="number" min="0" /></label>
        </div>
        <label>{{ t('accessEmail') }}<input :value="store.profile?.email || ''" type="email" readonly /></label>
        <p v-if="message" role="status">{{ message }}</p>
        <button class="button primary" type="submit" :disabled="saving || !store.profile">{{ t(saving ? 'saving' : 'saveProfile') }}</button>
      </form>
      <form v-if="tab === 'profile'" class="settings-body profile-form form-stack" @submit.prevent="savePassword">
        <h2>{{ t('changePassword') }}</h2>
        <div class="form-grid"><label>{{ t('currentPassword') }}<input v-model="credentials.currentPassword" type="password" autocomplete="current-password" required /></label><label>{{ t('newPassword') }}<input v-model="credentials.newPassword" type="password" autocomplete="new-password" minlength="8" required /></label></div>
        <p v-if="passwordMessage" role="status">{{ passwordMessage }}</p>
        <button class="button primary" type="submit" :disabled="savingPassword">{{ t(savingPassword ? 'saving' : 'changePassword') }}</button>
      </form>
    </div>
  </section>
</template>
