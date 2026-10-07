import { ref, computed, reactive } from "vue";
import { LeadsApi } from "../infrastructure/leads-api.js";
import { ContactAssembler } from "../infrastructure/contact.assembler.js";
import { useUiStore } from "../../shared/application/ui.store.js";
import { useAuthenticationStore } from "../../authentication/application/authentication.store.js";
import { useDashboardStore } from "../../dashboard/application/dashboard.store.js";
import { useI18n } from "../../i18n.js";

const api = new LeadsApi();

const store = (() => {
    const uiStore = useUiStore();
    const authStore = useAuthenticationStore();
    const dashboardStore = useDashboardStore();
    const { t } = useI18n();
    const contacts = ref([]);
    const leadEditor = ref({ open: false, contact: null, type: 'lead', stage: 'new' });

    const metrics = computed(() => {
        const won = contacts.value.filter(c => c.stage === 'won');
        return {
            total: contacts.value.length,
            active: contacts.value.filter(c => c.type === 'lead' && c.stage !== 'won').length,
            won: won.length,
            revenue: won.reduce((sum, c) => sum + Number(c.value), 0),
            conversion: contacts.value.length ? Math.round((won.length / contacts.value.length) * 100) : 0
        }
    });

    function fetchContacts() {
        const ownerId = authStore.profile?.id;
        if (!ownerId) { contacts.value = []; return Promise.resolve(); }
        return api.getContacts(ownerId).then(response => {
            if (authStore.profile?.id === ownerId) contacts.value = ContactAssembler.toEntitiesFromResponse(response);
        }).catch(console.error);
    }

    async function saveContact(values) {
        if (!authStore.profile?.id) throw new Error(t('signInFirst'));
        if (values.id && !contacts.value.some(c => c.id === values.id)) throw new Error(t('noOwner'));
        const isNew = !values.id;
        const payload = { ...values, ownerId: authStore.profile.id, owner: authStore.profile.name, type: values.type === 'customer' ? 'customer' : 'lead', value: Number(values.value) || 0 };
        const request = isNew ? api.createContact(payload) : api.updateContact(values.id, payload);
        try {
            const res = await request;
            const saved = ContactAssembler.toEntityFromResource(res.data);
            if (isNew) contacts.value.unshift(saved);
            else {
                const index = contacts.value.findIndex(c => c.id === saved.id);
                if (index !== -1) contacts.value[index] = saved;
            }
            uiStore.notify(t(res.activityError ? 'historySaveFailed' : isNew ? 'savedNew' : 'savedEdit'));
            leadEditor.value.open = false;
            await dashboardStore.fetchActivities();
            return saved;
        } catch (error) {
            uiStore.notify(error.response?.data?.message || t('saveFailed'));
            throw error;
        }
    }

    function moveContact(id, stage) {
        const contact = contacts.value.find(c => c.id === id);
        if (!contact || contact.stage === stage) return;
        const updated = { ...contact, stage, type: stage === 'won' ? 'customer' : contact.type };
        return api.updateContact(id, updated).then(async (response) => {
            contact.stage = stage;
            contact.type = updated.type;
            uiStore.notify(t(response.activityError ? 'historySaveFailed' : 'stageUpdated'));
            await dashboardStore.fetchActivities();
        }).catch(() => { uiStore.notify(t('saveFailed')); });
    }

    function reset() { contacts.value = []; leadEditor.value = { open: false, contact: null, type: 'lead', stage: 'new' }; }

    return reactive({ contacts, metrics, leadEditor, fetchContacts, saveContact, moveContact, reset });
})();

export function useLeadsStore() { return store; }
