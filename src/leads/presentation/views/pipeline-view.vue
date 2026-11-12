<script setup>
import { computed, ref, onMounted } from 'vue'
import ActivityFeed from '../../../dashboard/presentation/components/activity-feed.vue'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import MetricCard from '../../../dashboard/presentation/components/metric-card.vue'
import { useLeadsStore } from '../../application/leads.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

const props = defineProps({ search: String })
const store = useLeadsStore()
const { t } = useI18n()
const dragOver = ref('')
const filtersOpen = ref(false)
const tagFilter = ref('')
const sortValue = ref(false)
const tags = computed(() => [...new Set(store.contacts.flatMap(c => c.tags || []))])
function age(contact) {
  const days = contact.created_at ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / 86400000) : null
  return !Number.isFinite(days) ? '—' : t(days === 1 ? 'dayOld' : 'daysOld', { days: Math.max(0, days) })
}
const filtered = computed(() => {
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const term = normalize(props.search)
  const contacts = store.contacts.filter(c => normalize(`${c.name} ${c.company} ${c.email} ${c.phone}`).includes(term) && (!tagFilter.value || (c.tags || []).includes(tagFilter.value)))
  return sortValue.value ? contacts.sort((a, b) => b.value - a.value) : contacts
})

const stages = [
  { id: 'new', key: 'newStage', color: 'blue' },
  { id: 'contacted', key: 'contactedStage', color: 'amber' },
  { id: 'proposal', key: 'proposalStage', color: 'violet' },
  { id: 'won', key: 'wonStage', color: 'green' }
]

onMounted(() => { if (!store.contacts.length) store.fetchContacts() })

function startDrag(event, id) { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move' }
function drop(event, stage) { store.moveContact(event.dataTransfer.getData('text/plain'), stage); dragOver.value = '' }
</script>

<template>
  <div class="page-heading">
    <div><p class="eyebrow">{{ t('pipelineEyebrow') }}</p><h1>{{ t('pipelineTitle') }}</h1></div>
  </div>
  <section class="metrics-grid four">
    <MetricCard :label="t('totalContacts')" :value="store.metrics.total" icon="users" />
    <MetricCard :label="t('activeDeals')" :value="store.metrics.active" icon="pipeline" color="blue" />
    <MetricCard :label="t('wonRevenue')" :value="money(store.metrics.revenue)" icon="dollar" color="green" />
    <MetricCard :label="t('conversionRate')" :value="`${store.metrics.conversion}%`" icon="trend" color="amber" />
  </section>
  <div class="crm-layout">
    <section class="pipeline-section">
      <div class="section-toolbar"><h2>{{ t('pipelineTitle') }}</h2><div class="table-actions"><button class="button secondary small" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">{{ t('filter') }}</button><button class="button secondary small" :aria-pressed="sortValue" @click="sortValue = !sortValue">{{ t('value') }} {{ sortValue ? '↓' : '↕' }}</button></div></div>
      <label v-if="filtersOpen">{{ t('contactTags') }}<select v-model="tagFilter"><option value="">{{ t('allContacts') }}</option><option v-for="tag in tags" :key="tag">{{ tag }}</option></select></label>
      <div class="pipeline-board">
        <section v-for="stage in stages" :key="stage.id" class="pipeline-column" :class="{ 'drag-over': dragOver === stage.id }" @dragover.prevent="dragOver = stage.id" @dragleave.self="dragOver = ''" @drop.prevent="drop($event, stage.id)">
          <div class="column-heading"><span class="status-dot" :class="stage.color"></span><h3>{{ t(stage.key) }}</h3><span class="badge blue">{{ filtered.filter(c => c.stage === stage.id).length }}</span></div>
          <article v-for="contact in filtered.filter(c => c.stage === stage.id)" :key="contact.id" class="deal-card" draggable="true" @dragstart="startDrag($event, contact.id)" @dragend="dragOver = ''">
            <div class="deal-company"><span>{{ contact.company }}</span><button class="icon-button compact" type="button" :aria-label="t('editContact')" :title="t('editContact')" draggable="false" @click.stop="store.leadEditor = { open: true, contact }" @dragstart.stop.prevent><span class="ui-icon icon-more" aria-hidden="true" :style="{ width: '20px', height: '20px' }"></span></button></div>
            <button class="deal-title" @click="store.leadEditor = { open: true, contact }">{{ contact.name }}</button>
            <div class="deal-value"><strong>{{ money(contact.value) }}</strong><small>{{ age(contact) }}</small></div>
            <div class="deal-tags"><span v-for="tag in contact.tags" :key="tag" class="badge violet">{{ tag }}</span></div>
            <div class="deal-owner"><UserAvatar :name="contact.owner" size="sm" /><span>{{ contact.owner }}</span></div>
            <select class="stage-select" :value="contact.stage" @change="store.moveContact(contact.id, $event.target.value)">
              <option v-for="s in stages" :key="s.id" :value="s.id">{{ t(s.key) }}</option>
            </select>
          </article>
        </section>
      </div>
    </section>
    <aside class="panel pipeline-activity"><div class="panel-heading"><h2>{{ t('recentActivity') }}</h2></div><ActivityFeed /><router-link class="text-link" to="/reports">{{ t('viewActivity') }} →</router-link></aside>
  </div>
</template>
