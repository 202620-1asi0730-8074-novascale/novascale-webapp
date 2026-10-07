import { ref, reactive } from "vue";
import { DashboardApi } from "../infrastructure/dashboard-api.js";
import { ActivityAssembler } from "../infrastructure/activity.assembler.js";
import { useAuthenticationStore } from "../../authentication/application/authentication.store.js";

const api = new DashboardApi();

const store = (() => {
    const authStore = useAuthenticationStore();
    const activities = ref([]);
    function fetchActivities() {
        const ownerId = authStore.profile?.id;
        if (!ownerId) { activities.value = []; return Promise.resolve(); }
        return api.getActivities(ownerId).then(response => {
            if (authStore.profile?.id === ownerId) activities.value = ActivityAssembler.toEntitiesFromResponse(response);
        }).catch(console.error);
    }
    function reset() { activities.value = []; }
    return reactive({ activities, fetchActivities, reset });
})();

export function useDashboardStore() { return store; }

const stageKeys = { new: 'newStage', contacted: 'contactedStage', proposal: 'proposalStage', won: 'wonStage' }
const fieldKeys = { name: 'name', company: 'company', email: 'email', phone: 'phone', type: 'contactType', stage: 'stage', value: 'value' }

// Use the values stored with the event, not the contact's current values.
export function activityDetails(item, { t, money }) {
  function format(field, value) {
    if (value === null || value === undefined || value === '') return t('emptyValue')
    if (field === 'value') return money(value)
    if (field === 'stage') return stageKeys[value] ? t(stageKeys[value]) : String(value)
    if (field === 'type') return t(value === 'customer' ? 'customer' : 'lead')
    return String(value)
  }
  const changes = (item.changes || []).filter(change => fieldKeys[change.field])
  if (changes.length) {
    return changes.map(change => `${t(fieldKeys[change.field])}: ${format(change.field, change.from)} → ${format(change.field, change.to)}`)
  }
  const details = []
  const created = ['lead_created', 'customer_created'].includes(item.eventType)
  if (item.stage) details.push(`${t(created ? 'stage' : 'recordedStage')}: ${format('stage', item.stage)}`)
  if (created && item.value !== null && item.value !== undefined) details.push(`${t('value')}: ${money(item.value)}`)
  if (!created && ['stage_changed', 'contact_updated'].includes(item.eventType)) details.push(t('historyUnavailable'))
  if (!details.length) details.push(item.text || t('historyUnavailable'))
  return details
}
