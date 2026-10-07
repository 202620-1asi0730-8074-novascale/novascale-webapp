<script setup>
import { computed } from 'vue'
import ActivityFeed from '../components/activity-feed.vue'
import MetricCard from '../components/metric-card.vue'
import { useLeadsStore } from '../../../leads/application/leads.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

// Añadimos defineProps para evitar el warning amarillo
defineProps({ search: String })
const store = useLeadsStore()
const { t } = useI18n()
</script>
<template>
  <div class="page-heading">
    <div><h1>{{ t('results') }}</h1></div>
  </div>
  <div class="metrics-grid">
    <MetricCard :label="t('wonRevenue')" :value="money(store.metrics.revenue)" icon="dollar" color="green" />
    <MetricCard :label="t('openDeals')" :value="store.metrics.active" icon="pipeline" />
    <MetricCard :label="t('conversion')" :value="`${store.metrics.conversion}%`" icon="trend" color="blue" />
  </div>
  <div class="reports-grid">
    <section class="panel">
      <div class="panel-heading"><h2>{{ t('activityLog') }}</h2></div>
      <ActivityFeed />
    </section>
  </div>
</template>
