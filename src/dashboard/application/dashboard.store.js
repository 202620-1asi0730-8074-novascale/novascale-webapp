import { apiErrorMessage } from "../../shared/infrastructure/base-api.js";
import { useUiStore } from "../../shared/application/ui.store.js";
import { ref, reactive } from "vue";
import { DashboardApi } from "../infrastructure/dashboard-api.js";
import { ActivityAssembler } from "../infrastructure/activity.assembler.js";
import { useAuthenticationStore } from "../../authentication/application/authentication.store.js";

const api = new DashboardApi();

const store = (() => {
    const authStore = useAuthenticationStore();
    const activities = ref([]);
    let requestId = 0;
    const summary = ref({ wonSales: 0, wonRevenue: 0, conversionRate: 0, activeLeads: 0, activeOpportunities: 0 });
    const personalSummary = ref({ ...summary.value });
    async function fetchActivities() {
        const currentRequest = ++requestId;
        const ownerId = authStore.profile?.id;
        if (!ownerId) { reset(); return; }
        try {
            const [activitiesResponse, summaryResponse, personalResponse] = await Promise.all([
                api.getActivities(), api.getSummary(), api.getSummary(ownerId)
            ]);
            if (currentRequest !== requestId || authStore.profile?.id !== ownerId) return;
            activities.value = ActivityAssembler.toEntitiesFromResponse(activitiesResponse);
            summary.value = summaryResponse.data;
            personalSummary.value = personalResponse.data;
        } catch (error) { if (currentRequest === requestId) useUiStore().notify(apiErrorMessage(error)); }
    }
    function reset() {
        requestId++;
        activities.value = [];
        summary.value = { wonSales: 0, wonRevenue: 0, conversionRate: 0, activeLeads: 0, activeOpportunities: 0 };
        personalSummary.value = { ...summary.value };
    }
    return reactive({ activities, summary, personalSummary, fetchActivities, reset });
})();

export function useDashboardStore() { return store; }

const stageKeys = { new: 'newStage', contacted: 'contactedStage', proposal: 'proposalStage', won: 'wonStage' }
const fieldKeys = { name: 'name', company: 'company', email: 'email', phone: 'phone', type: 'contactType', stage: 'stage', value: 'value', source: 'leadSource' }

export function activityDetails(item, { t, money }) {
  function format(field, value) {
    if (value === null || value === undefined || value === '') return t('emptyValue')
    if (field === 'source') return t({ web: 'sourceWeb', referral: 'sourceReferral', other: 'sourceOther' }[value] || 'emptyValue')
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
  if (!details.length && item.text) details.push(item.text)
  return details
}
