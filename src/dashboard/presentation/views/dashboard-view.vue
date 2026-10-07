<script setup>
import { computed } from 'vue'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import MetricCard from '../components/metric-card.vue'
import ActivityFeed from '../components/activity-feed.vue'
import { useAuthenticationStore } from '../../../authentication/application/authentication.store.js'
import { useLeadsStore } from '../../../leads/application/leads.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

const props = defineProps({ search: String })
const authStore = useAuthenticationStore()
const leadsStore = useLeadsStore()
const { locale, t } = useI18n()

const quota = computed(() => Math.min(100, Math.round(leadsStore.metrics.revenue / (authStore.profile?.quota || 1) * 100)))
const date = computed(() => new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()))
</script>

<template>
  <div class="page-heading">
    <div><h1>{{ t('overview', { name: authStore.profile?.name?.split(' ')[0] || '...' }) }}</h1></div>
    <span class="date-label"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('calendar')" :style="{ width: 16 + 'px', height: 16 + 'px' }"></span>{{ date }}</span>
  </div>

  <div class="dashboard-layout">
    <section class="metrics-grid dashboard-metrics">
      <MetricCard :label="t('activeLeads')" :value="leadsStore.metrics.active" icon="users" />
      <MetricCard :label="t('wonDeals')" :value="leadsStore.metrics.won" icon="award" color="green" />
      <MetricCard :label="t('revenue')" :value="money(leadsStore.metrics.revenue)" icon="dollar" color="blue" />
    </section>

    <section class="panel dashboard-activity">
      <div class="panel-heading"><h2>{{ t('recentActivity') }}</h2></div>
      <ActivityFeed />
    </section>

    <section v-if="authStore.profile" class="panel profile-card">
      <UserAvatar :name="authStore.profile.name" size="xl" />
      <h2>{{ authStore.profile.name }}</h2>
      <div class="quota">
        <div><strong>{{ t('salesGoal') }}</strong><strong class="text-violet">{{ quota }}%</strong></div>
        <progress :value="quota" max="100"></progress>
        <div><small>{{ t('achieved', { amount: money(leadsStore.metrics.revenue) }) }}</small></div>
      </div>
    </section>
  </div>
</template>
