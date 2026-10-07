<script setup>
import { watch, onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserAvatar from './user-avatar.vue'
import { useLeadsStore } from '../../../leads/application/leads.store.js'
import { useAuthenticationStore } from '../../../authentication/application/authentication.store.js'
import { useConversationsStore } from '../../../conversations/application/conversations.store.js'
import { useDashboardStore } from '../../../dashboard/application/dashboard.store.js'
import { useI18n } from '../../../i18n.js'

defineProps({ search: String })
const emit = defineEmits(['update:search'])
const route = useRoute()
const router = useRouter()
const leadsStore = useLeadsStore()
const authStore = useAuthenticationStore()
const conversationsStore = useConversationsStore()
const dashboardStore = useDashboardStore()
const { locale, setLocale, t } = useI18n()
const links = [
  ['dashboard', 'dashboard', 'dashboard'], ['leads/directory', 'users', 'leads'],
  ['leads/pipeline', 'pipeline', 'pipeline'], ['leads/customers', 'customer', 'customers'],
  ['conversations', 'chat', 'conversations'], ['reports', 'chart', 'reports'], ['settings', 'settings', 'settings'],
]
const onCustomers = computed(() => route.path === '/leads/customers')
const mobileMenuOpen = ref(false)
const mobileTitle = computed(() => {
  const match = links.find(([path]) => route.path === `/${path}`)
  return match ? t(match[2]) : 'NovaLeads'
})
const bottomLinks = links.filter(([path]) => ['dashboard', 'leads/directory', 'leads/pipeline', 'leads/customers', 'settings'].includes(path))
watch(route, () => { emit('update:search', ''); mobileMenuOpen.value = false })
function addContact() { leadsStore.leadEditor = { open: true, contact: null, stage: 'new', type: onCustomers.value ? 'customer' : 'lead' } }
function handleLogout() {
  authStore.signOut()
  leadsStore.reset()
  conversationsStore.reset()
  dashboardStore.reset()
  router.push({ name: 'login' })
}
onMounted(async () => {
  try { await authStore.fetchProfile(); await leadsStore.fetchContacts() }
  catch { router.push({ name: 'login' }) }
})
</script>
<template>
  <div class="app-shell" :class="{ 'conversation-page': route.path === '/conversations', 'dashboard-page': route.path === '/dashboard', 'directory-page': ['/leads/directory', '/leads/customers'].includes(route.path), 'settings-page': route.path === '/settings' }">
    <a class="skip-link" href="#main-content" @click.prevent="() => $refs.main.focus()">{{ t('skip') }}</a>
    <aside class="sidebar">
      <router-link class="sidebar-brand" to="/dashboard"><img class="brand-image" src="/src/assets/novaleads-logo-light.svg" alt="NovaLeads" /></router-link>
      <p class="nav-label">{{ t('workspace') }}</p>
      <nav :aria-label="t('workspace')">
        <router-link v-for="[path, icon, label] in links" :key="path" :to="`/${path}`" class="nav-item" :class="{ active: route.path === `/${path}` }" :aria-current="route.path === `/${path}` ? 'page' : undefined"><span class="ui-icon" aria-hidden="true" :class="'icon-' + (icon)" :style="{ width: 20 + 'px', height: 20 + 'px' }"></span><span>{{ t(label) }}</span></router-link>
      </nav>
      <div class="sidebar-bottom">
        <div class="plan-mini"><span class="plan-icon"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('spark')" :style="{ width: 19 + 'px', height: 19 + 'px' }"></span></span><strong>{{ t('promoTitle') }}</strong><p>{{ t('promoBody') }}</p><router-link to="/pricing">{{ t('plans') }} <span class="ui-icon" aria-hidden="true" :class="'icon-' + ('arrow')" :style="{ width: 16 + 'px', height: 16 + 'px' }"></span></router-link></div>
        <div class="sidebar-profile"><router-link to="/settings" class="profile-link"><UserAvatar :name="authStore.profile?.name || ''" /><span><strong>{{ authStore.profile?.name || '' }}</strong><small>{{ authStore.profile?.role === 'Vendedor' ? t('sellerRole') : authStore.profile?.role === 'Director de ventas' ? t('directorRole') : authStore.profile?.role || '' }}</small></span></router-link><button class="logout-button" :title="t('logout')" @click="handleLogout"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('logout')" :style="{ width: 19 + 'px', height: 19 + 'px' }"></span></button></div>
      </div>
    </aside>
    <div class="workspace">
      <header class="mobile-header">
        <button class="mobile-menu-button" :aria-label="t('workspace')" :aria-expanded="mobileMenuOpen" @click="mobileMenuOpen = !mobileMenuOpen">☰</button>
        <router-link v-if="route.path === '/dashboard'" to="/dashboard" class="mobile-brand"><img src="/src/assets/novaleads-logo.svg" alt="NovaLeads" /></router-link>
        <strong v-else>{{ mobileTitle }}</strong>
        <router-link to="/settings" class="mobile-avatar-link" :aria-label="t('myProfile')"><UserAvatar :name="authStore.profile?.name || ''" /></router-link>
      </header>
      <nav v-if="mobileMenuOpen" class="mobile-drawer" :aria-label="t('workspace')">
        <router-link v-for="[path, icon, label] in links" :key="path" :to="`/${path}`"><span class="ui-icon" aria-hidden="true" :class="'icon-' + (icon)" :style="{ width: '18px', height: '18px' }"></span>{{ t(label) }}</router-link>
        <div class="language-switch"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
        <button @click="handleLogout">{{ t('logout') }}</button>
      </nav>
      <header class="topbar">
        <label class="global-search"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('search')" :style="{ width: 19 + 'px', height: 19 + 'px' }"></span><input :value="search" type="search" :placeholder="t('search')" @input="emit('update:search', $event.target.value)" /><kbd>/</kbd></label>
        <div class="workspace-team"><span class="status-dot violet"></span>{{ authStore.profile?.company || '' }}<span class="team-label">{{ t('workspaceLabel') }}</span></div>
        <div class="topbar-actions"><div class="language-switch"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div><button class="button primary add-lead-top" @click="addContact"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('plus')" :style="{ width: 18 + 'px', height: 18 + 'px' }"></span><span>{{ t(onCustomers ? 'addCustomer' : 'addLead') }}</span></button></div>
      </header>
      <main id="main-content" ref="main" class="main-content" tabindex="-1"><slot /></main>
      <footer class="workspace-footer"><span>© 2026 NovaLeads</span><span><span class="status-dot green"></span>{{ t('localApi') }}</span></footer>
    </div>
    <nav class="mobile-bottom-nav" :aria-label="t('workspace')">
      <router-link v-for="[path, icon, label] in bottomLinks" :key="path" :to="`/${path}`" :class="{ active: route.path === `/${path}` }" :aria-current="route.path === `/${path}` ? 'page' : undefined"><span class="ui-icon" aria-hidden="true" :class="'icon-' + (icon)" :style="{ width: '20px', height: '20px' }"></span><span>{{ t(label) }}</span></router-link>
    </nav>
  </div>
</template>
