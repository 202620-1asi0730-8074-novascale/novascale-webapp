<script setup>
import { computed } from 'vue'
import ActivityFeed from '../components/activity-feed.vue'
import MetricCard from '../components/metric-card.vue'
import { useDashboardStore } from '../../application/dashboard.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

defineProps({ search: String })
const store = useDashboardStore()
const { t } = useI18n()
</script>
<template>
  <div class="page-heading">
    <div><h1>{{ t('results') }}</h1></div>
  </div>
  <div class="metrics-grid">
    <MetricCard :label="t('wonRevenue')" :value="money(store.summary.wonRevenue)" icon="dollar" color="green" />
    <MetricCard :label="t('openDeals')" :value="store.summary.activeOpportunities" icon="pipeline" />
    <MetricCard :label="t('conversion')" :value="`${store.summary.conversionRate}%`" icon="trend" color="blue" />
  </div>
  <div class="reports-grid">
    <section class="panel">
      <div class="panel-heading"><h2>{{ t('activityLog') }}</h2></div>
      <ActivityFeed />
    </section>
  </div>
</template>
