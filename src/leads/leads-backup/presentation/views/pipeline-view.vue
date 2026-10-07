<script setup>
import { computed, ref, onMounted } from 'vue'
import MetricCard from '../../../dashboard/presentation/components/metric-card.vue'
import { useLeadsStore } from '../../application/leads.store.js'
import { money } from '../../../i18n.js'
import { useI18n } from '../../../i18n.js'

const props = defineProps({ search: String })
const store = useLeadsStore()
const { t } = useI18n()
const dragOver = ref('')

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
      <div class="pipeline-board">
        <section v-for="stage in stages" :key="stage.id" class="pipeline-column" :class="{ 'drag-over': dragOver === stage.id }" @dragover.prevent="dragOver = stage.id" @dragleave.self="dragOver = ''" @drop.prevent="drop($event, stage.id)">
          <div class="column-heading"><span class="status-dot" :class="stage.color"></span><h3>{{ t(stage.key) }}</h3></div>
          <article v-for="contact in store.contacts.filter(c => c.stage === stage.id)" :key="contact.id" class="deal-card" draggable="true" @dragstart="startDrag($event, contact.id)" @dragend="dragOver = ''">
            <div class="deal-company"><span>{{ contact.company }}</span></div>
            <button class="deal-title" @click="store.leadEditor = { open: true, contact }">{{ contact.name }}</button>
            <div class="deal-value"><strong>{{ money(contact.value) }}</strong></div>
            <select class="stage-select" :value="contact.stage" @change="store.moveContact(contact.id, $event.target.value)">
              <option v-for="s in stages" :key="s.id" :value="s.id">{{ t(s.key) }}</option>
            </select>
          </article>
        </section>
      </div>
    </section>
  </div>
</template>
