<script setup>
import { computed } from 'vue'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import MetricCard from '../components/metric-card.vue'
import ActivityFeed from '../components/activity-feed.vue'
import { useAuthenticationStore } from '../../../authentication/application/authentication.store.js'
import { useDashboardStore } from '../../application/dashboard.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

const props = defineProps({ search: String })
const authStore = useAuthenticationStore()
const dashboardStore = useDashboardStore()
const { locale, t } = useI18n()

const monthly = computed(() => ({ won: dashboardStore.personalSummary.wonSales, revenue: dashboardStore.personalSummary.wonRevenue, conversion: dashboardStore.personalSummary.conversionRate }))
const quota = computed(() => authStore.profile?.quota > 0 ? Math.min(100, Math.round(monthly.value.revenue / authStore.profile.quota * 100)) : 0)
const date = computed(() => new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()))
</script>

<template>
  <div class="page-heading">
    <div><h1>{{ t('overview', { name: authStore.profile?.name?.split(' ')[0] || '...' }) }}</h1></div>
    <span class="date-label"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('calendar')" :style="{ width: 16 + 'px', height: 16 + 'px' }"></span>{{ date }}</span>
  </div>

  <div class="dashboard-layout">
    <section class="metrics-grid dashboard-metrics">
      <MetricCard :label="t('activeLeads')" :value="dashboardStore.personalSummary.activeLeads" icon="users" />
      <MetricCard :label="t('monthlyWon')" :value="monthly.won" icon="award" color="green" />
      <MetricCard :label="t('personalConversion')" :value="monthly.conversion + '%'" icon="trend" color="blue" />
    </section>

    <section class="panel dashboard-activity">
      <div class="panel-heading"><h2>{{ t('recentActivity') }}</h2></div>
      <ActivityFeed />
    </section>

    <section v-if="authStore.profile" class="panel profile-card">
      <UserAvatar :name="authStore.profile.name" size="xl" />
      <h2>{{ authStore.profile.name }}</h2>
      <p>{{ t(authStore.profile.role === 'Director de ventas' ? 'directorRole' : 'sellerRole') }}</p>
      <p><a :href="'mailto:' + authStore.profile.email">{{ authStore.profile.email }}</a></p><p v-if="authStore.profile.phone">{{ authStore.profile.phone }}</p>
      <router-link class="button secondary small" to="/settings?tab=profile">{{ t('editProfile') }}</router-link>
      <div class="quota">
        <div><strong>{{ t('monthlyGoal') }}</strong><strong class="text-violet">{{ quota }}%</strong></div>
        <progress :value="quota" max="100"></progress>
        <div><small>{{ t('achieved', { amount: money(monthly.revenue) }) }}</small><small>{{ t('targetAmount', { amount: money(authStore.profile.quota) }) }}</small></div>
      </div>
    </section>
  </div>
</template>
