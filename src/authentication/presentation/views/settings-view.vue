<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import { useAuthenticationStore } from '../../application/authentication.store.js'
import { useRoute } from 'vue-router'
import AppModal from '../../../shared/presentation/components/app-modal.vue'
import { BaseApi, apiErrorMessage } from '../../../shared/infrastructure/base-api.js'
import { AuthenticationApi } from '../../infrastructure/authentication-api.js'
import { useLeadsStore } from '../../../leads/application/leads.store.js'
import { useI18n } from '../../../i18n.js'

defineProps({ search: String })
const store = useAuthenticationStore()
const { t } = useI18n()
const route = useRoute()
const tab = ref(route.query.tab === 'profile' ? 'profile' : 'users')
watch(() => route.query.tab, value => { if (value === 'profile') tab.value = 'profile' })
const team = computed(() => store.profile ? [store.profile, ...store.users.filter(user => user.id !== store.profile.id && user.organizationId === store.profile.organizationId)] : [])
const draft = reactive({ name: '', company: '', quota: 0, phone: '' })
const message = ref('')
const saving = ref(false)
const credentials = reactive({ currentPassword: '', newPassword: '' })
const passwordMessage = ref('')
const savingPassword = ref(false)
const api = new BaseApi()
const leadsStore = useLeadsStore()
const authApi = new AuthenticationApi()
const roles = ref([])
const tags = ref([])
const editor = ref(null)
const editing = ref(null)
const editorBusy = ref(false)
const memberSaving = reactive({})
const editorError = ref('')
const showPasswords = reactive({ current: false, next: false, member: false })
const member = reactive({ name: '', email: '', password: '', id_role: '' })
const tagDraft = reactive({ name: '', color: '#6366f1' })
function roleLabel(role) { return role.systemCode === 'OWNER' ? t('directorRole') : role.systemCode === 'SELLER' ? t('sellerRole') : role.name }

onMounted(() => {
  store.fetchUsers().catch(error => { message.value = apiErrorMessage(error) })
  loadCatalogs()
})
watch(() => store.profile, profile => {
  if (profile) Object.assign(draft, { name: profile.name, company: profile.company, quota: profile.quota, phone: profile.phone || '' })
}, { immediate: true })

async function save() {
  message.value = ''
  saving.value = true
  try {
    await store.updateProfile({ name: draft.name.trim(), company: store.profile?.isOwner ? draft.company.trim() : undefined, quota: Number(draft.quota), phone: draft.phone.trim() })
    await useLeadsStore().fetchContacts()
    message.value = t('profileSaved')
  } catch (error) { message.value = apiErrorMessage(error, 'profileFailed') }
  finally { saving.value = false }
}
async function savePassword() {
  passwordMessage.value = ''
  savingPassword.value = true
  try {
    await store.changePassword(credentials.currentPassword, credentials.newPassword)
    credentials.currentPassword = ''
    credentials.newPassword = ''
    passwordMessage.value = t('passwordChanged')
  } catch (error) { passwordMessage.value = apiErrorMessage(error, 'passwordChangeFailed') }
  finally { savingPassword.value = false }
}
async function loadCatalogs() {
  try {
    const [roleResponse, tagResponse] = await Promise.all([authApi.getRoles(), api.getAllPages('/tags')])
    roles.value = roleResponse.data
    tags.value = tagResponse.data
  } catch (error) { message.value = apiErrorMessage(error) }
}
async function patchMember(user, changes) {
  const id = String(user.id)
  if (memberSaving[id]) return
  memberSaving[id] = true
  message.value = ''
  const previous = Object.fromEntries(Object.keys(changes).map(key => [key, user[key] && typeof user[key] === 'object' ? { ...user[key] } : user[key]]))
  Object.assign(user, changes)
  try {
    const response = await authApi.saveMember(changes, user.id)
    Object.assign(user, response.data)
    const entry = store.users.find(member => member.id === user.id)
    if (entry) Object.assign(entry, response.data)
    if (user.id === store.profile?.id) {
      Object.assign(store.profile, response.data)
      window.dispatchEvent(new Event('novaleads:access-changed'))
    }
  } catch (error) {
    Object.assign(user, previous)
    message.value = apiErrorMessage(error, 'actionSaveFailed')
  } finally { memberSaving[id] = false }
}
async function changeRole(user, id) {
  const role = roles.value.find(role => String(role.id) === String(id))
  if (role) await patchMember(user, { id_role: role.id, role: role.name })
}
async function changePermission(user, permission, enabled) {
  await patchMember(user, { permissions: { ...user.permissions, [permission]: enabled } })
}
function openMember(user = null) {
  editing.value = user
  Object.assign(member, { name: user?.name || '', email: user?.email || '', password: '', id_role: user?.id_role || roles.value.find(role => role.systemCode === 'SELLER')?.id || '' })
  editorError.value = ''
  editor.value = 'user'
}
function openTag(tag = null) {
  editing.value = tag
  Object.assign(tagDraft, { name: tag?.name || '', color: tag?.color || '#6366f1' })
  editorError.value = ''
  editor.value = 'tag'
}
async function saveEditor() {
  if (editorBusy.value) return
  editorBusy.value = true
  editorError.value = ''
  try {
    if (editor.value === 'tag') {
      const payload = { name: tagDraft.name.trim(), color: tagDraft.color }
      if (!payload.name || tags.value.some(tag => tag.id !== editing.value?.id && tag.name.toLowerCase() === payload.name.toLowerCase())) throw new Error(t('duplicateTag'))
      if (editing.value) await api.http.put('/tags/' + editing.value.id, payload)
      else await api.http.post('/tags', payload)
      await loadCatalogs()
      await leadsStore.fetchContacts()
    } else {
      const role = roles.value.find(role => String(role.id) === String(member.id_role))
      if (!role) throw new Error(t('selectRole'))
      await authApi.saveMember({ ...member, name: member.name.trim(), email: member.email.trim().toLowerCase() }, editing.value?.id)
      await store.fetchUsers()
      if (editing.value?.id === store.profile?.id) {
        await store.fetchProfile()
        window.dispatchEvent(new Event('novaleads:access-changed'))
      }
      await leadsStore.fetchContacts()
    }
    editor.value = null
  } catch (error) { editorError.value = error.isAxiosError ? apiErrorMessage(error, 'actionSaveFailed') : error.message || t('actionSaveFailed') }
  finally { editorBusy.value = false }
}
async function removeTag(tag) {
  try {
    await api.http.delete('/tags/' + tag.id)
    await loadCatalogs()
    await leadsStore.fetchContacts()
  } catch (error) { message.value = apiErrorMessage(error, 'actionDeleteFailed') }
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
      <button v-if="tab === 'users' && store.profile?.isOwner" class="button primary small" @click="openMember()">+ {{ t('addUser') }}</button>
    </div>
    <p v-if="message && tab !== 'profile'" class="error-message" role="status">{{ message }}</p>
    <div id="settings-content">
      <template v-if="tab === 'users'">
        <div class="table-scroll">
          <table class="users-table">
            <thead><tr><th>{{ t('name') }}</th><th>{{ t('email') }}</th><th>{{ t('role') }}</th><th>{{ t('permissions') }}</th><th>{{ t('actions') }}</th></tr></thead>
            <tbody>
            <tr v-for="user in team" :key="user.id">
              <td :data-label="t('name')"><UserAvatar :name="user.name" /><strong>{{ user.name }}<span v-if="String(user.id) === String(store.profile?.id)" class="badge violet">{{ t('you') }}</span></strong></td>
              <td :data-label="t('email')">{{ user.email }}</td>
              <td :data-label="t('role')"><select class="team-role-select" :aria-label="t('role') + ': ' + user.name" :disabled="!store.profile?.isOwner || memberSaving[String(user.id)]" :value="user.id_role || roles.find(role => role.name === user.role)?.id" @change="changeRole(user, $event.target.value)"><option v-for="role in roles" :key="role.id" :value="role.id">{{ roleLabel(role) }}</option></select></td>
              <td :data-label="t('permissions')"><div class="permission-options"><label v-for="permission in ['exportData', 'deleteLeads']" :key="permission"><input type="checkbox" role="switch" :disabled="!store.profile?.isOwner || memberSaving[String(user.id)]" :checked="user.permissions?.[permission] !== false" @change="changePermission(user, permission, $event.target.checked)" />{{ t(permission) }}</label></div></td>
              <td><button class="icon-button compact" :aria-label="t('editUser')" :disabled="!store.profile?.isOwner || memberSaving[String(user.id)]" @click="openMember(user)"><span class="ui-icon icon-edit" aria-hidden="true"></span></button></td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="mobile-users-list">
          <p class="mobile-section-label">{{ t('usersLabel') }}</p>
          <article v-for="user in team" :key="user.id" class="mobile-user-card">
            <div class="mobile-user-heading"><UserAvatar :name="user.name" /><div><strong>{{ user.name }}<span v-if="String(user.id) === String(store.profile?.id)" class="badge violet">{{ t('you') }}</span></strong><small>{{ user.email }}</small></div></div>
            <button v-if="store.profile?.isOwner" class="button secondary small" @click="openMember(user)">{{ t('editUser') }}</button><div class="permission-options"><label v-for="permission in ['exportData', 'deleteLeads']" :key="permission"><input type="checkbox" :disabled="!store.profile?.isOwner || memberSaving[String(user.id)]" :checked="user.permissions?.[permission] !== false" @change="changePermission(user, permission, $event.target.checked)" />{{ t(permission) }}</label></div><div class="mobile-user-role"><span>{{ t('role') }}</span><strong>{{ user.role === 'Vendedor' ? t('sellerRole') : user.role === 'Director de ventas' ? t('directorRole') : user.role }}</strong></div>
          </article>
        </div>
      </template>
      <form v-else-if="tab === 'profile'" class="settings-body profile-form form-stack" @submit.prevent="save">
        <div class="form-grid">
          <label>{{ t('name') }}<input v-model="draft.name" required /></label>
          <label>{{ t('company') }}<input v-model="draft.company" required :readonly="!store.profile?.isOwner" /></label>
          <label>{{ t('phone') }}<input v-model="draft.phone" type="tel" /></label>
          <label>{{ t('quota') }}<input v-model="draft.quota" required type="number" min="0" step="0.01" max="9999999999.99" /></label>
        </div>
        <label>{{ t('accessEmail') }}<input :value="store.profile?.email || ''" type="email" readonly /></label>
        <p v-if="message" role="status">{{ message }}</p>
        <button class="button primary" type="submit" :disabled="saving || !store.profile">{{ t(saving ? 'saving' : 'saveProfile') }}</button>
      </form>

      <form v-if="tab === 'profile'" class="settings-body profile-form form-stack" @submit.prevent="savePassword">
        <h2>{{ t('changePassword') }}</h2>
        <div class="form-grid"><label>{{ t('currentPassword') }}<span class="password-input"><input v-model="credentials.currentPassword" :type="showPasswords.current ? 'text' : 'password'" autocomplete="current-password" required /><button type="button" :aria-label="t(showPasswords.current ? 'hidePassword' : 'showPassword')" @click="showPasswords.current = !showPasswords.current"><span class="ui-icon" :class="showPasswords.current ? 'icon-eye' : 'icon-eye-closed'" aria-hidden="true"></span></button></span></label><label>{{ t('newPassword') }}<span class="password-input"><input v-model="credentials.newPassword" :type="showPasswords.next ? 'text' : 'password'" autocomplete="new-password" minlength="8" required /><button type="button" :aria-label="t(showPasswords.next ? 'hidePassword' : 'showPassword')" @click="showPasswords.next = !showPasswords.next"><span class="ui-icon" :class="showPasswords.next ? 'icon-eye' : 'icon-eye-closed'" aria-hidden="true"></span></button></span></label></div>
        <p v-if="passwordMessage" role="status">{{ passwordMessage }}</p>
        <button class="button primary" type="submit" :disabled="savingPassword">{{ t(savingPassword ? 'saving' : 'changePassword') }}</button>
      </form>
    </div>
  </section>
  <section v-if="tab === 'users'" class="panel tag-management"><h2>{{ t('productTags') }}</h2><div class="tag-list"><span v-for="tag in tags" :key="tag.id" class="badge violet" :style="{ color: tag.color, backgroundColor: tag.color ? tag.color + '18' : undefined }"><button :disabled="!store.profile?.permissions?.manageTags" @click="openTag(tag)">{{ tag.name }}</button><button v-if="store.profile?.permissions?.manageTags" :aria-label="t('deleteTag') + ': ' + tag.name" @click="removeTag(tag)">×</button></span><button v-if="store.profile?.permissions?.manageTags" class="button secondary small" @click="openTag()">+ {{ t('createTag') }}</button></div></section>
  <AppModal v-if="editor" class="lead-modal" :title="t(editor === 'tag' ? 'productTags' : editing ? 'editUser' : 'addUser')" @close="!editorBusy && (editor = null)">
    <form @submit.prevent="saveEditor"><div class="modal-body form-stack">
      <template v-if="editor === 'tag'"><label>{{ t('name') }}<input v-model="tagDraft.name" required /></label><label>{{ t('color') }}<input v-model="tagDraft.color" type="color" /></label></template>
      <template v-else><label>{{ t('name') }}<input v-model="member.name" required /></label><label>{{ t('email') }}<input v-model="member.email" type="email" required /></label><label>{{ t('password') }}<span class="password-input"><input v-model="member.password" :type="showPasswords.member ? 'text' : 'password'" :required="!editing" minlength="8" autocomplete="new-password" /><button type="button" :aria-label="t(showPasswords.member ? 'hidePassword' : 'showPassword')" @click="showPasswords.member = !showPasswords.member"><span class="ui-icon" :class="showPasswords.member ? 'icon-eye' : 'icon-eye-closed'" aria-hidden="true"></span></button></span></label><label>{{ t('role') }}<select v-model="member.id_role" required><option v-for="role in roles" :key="role.id" :value="role.id">{{ roleLabel(role) }}</option></select></label></template>
      <p v-if="editorError" class="error-message" role="alert">{{ editorError }}</p>
    </div><div class="modal-footer"><button type="button" class="button secondary" :disabled="editorBusy" @click="editor = null">{{ t('cancel') }}</button><button type="submit" class="button primary" :disabled="editorBusy">{{ t(editorBusy ? 'saving' : 'save') }}</button></div></form>
  </AppModal>
</template>
