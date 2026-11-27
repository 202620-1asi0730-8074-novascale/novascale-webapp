import { apiErrorMessage } from "../../shared/infrastructure/base-api.js";
import { ref, reactive } from "vue";
import { ConversationsApi } from "../infrastructure/conversations-api.js";
import { MessageAssembler } from "../infrastructure/message.assembler.js";
import { useLeadsStore } from "../../leads/application/leads.store.js";
import { useUiStore } from "../../shared/application/ui.store.js";
import { useI18n } from "../../i18n.js";
const api = new ConversationsApi();

const store = (() => {
    const leadsStore = useLeadsStore();
    const uiStore = useUiStore();
    const { t } = useI18n();
    let requestId = 0;
    let generation = 0;
    let gmailRequestId = 0;
    let messageRevision = 0;
    const messages = ref([]);
    const pendingSince = ref(null);
    const loading = ref(false);
    const activeContactId = ref(null);
    const gmail = ref({ configured: false, connected: false, email: null, canManage: false });
    const syncing = ref(false);

    async function loadGmail() {
        const currentGeneration = generation;
        const currentRequest = ++gmailRequestId;
        const response = await api.getGmailStatus();
        if (currentGeneration === generation && currentRequest === gmailRequestId) gmail.value = response.data;
    }
    async function connectGmail() { window.location.assign((await api.connectGmail()).data.url); }
    async function disconnectGmail() { await api.disconnectGmail(); await loadGmail(); }

    function fetchMessages(contactId, { background = false, sync = false } = {}) {
        const currentRequest = ++requestId;
        const currentRevision = messageRevision;
        if (!background) { messages.value = []; pendingSince.value = null; }
        loading.value = false;
        if (!contactId || !leadsStore.contacts.some(c => c.id === contactId)) {
            messages.value = [];
            pendingSince.value = null;
            syncing.value = false;
            return Promise.resolve();
        }
        loading.value = !background;
        syncing.value = sync && gmail.value.connected;
        const shouldSync = syncing.value;
        function applyMessages(response) {
            if (currentRequest === requestId && currentRevision === messageRevision && activeContactId.value === contactId) {
                messages.value = MessageAssembler.toEntitiesFromResponse(response);
                pendingSince.value = response.pendingSince;
                loading.value = false;
            }
        }
        return api.getMessages(contactId).then(async response => {
            applyMessages(response);
            if (shouldSync && currentRequest === requestId && activeContactId.value === contactId) {
                await api.syncGmail(contactId);
                if (currentRequest === requestId && activeContactId.value === contactId) applyMessages(await api.getMessages(contactId));
            }
        }).catch(error => {
            if (currentRequest === requestId) {
                if (['GmailReconnect', 'GmailNotConnected'].includes(error.response?.data?.code)) gmail.value.connected = false;
                uiStore.notify(apiErrorMessage(error));
            }
        }).finally(() => {
            if (currentRequest === requestId) { loading.value = false; syncing.value = false; }
        });
    }

    function sendMessage(text, attachments = [], deliveryRequestId = crypto.randomUUID()) {
        if (!leadsStore.contacts.some(c => c.id === activeContactId.value)) return Promise.reject(new Error(t('noOwner')));
        const currentGeneration = generation;
        const payload = { attachments, contactId: activeContactId.value, requestId: deliveryRequestId, text };
        return api.sendMessage(payload).then(async response => {
            if (currentGeneration !== generation || activeContactId.value !== payload.contactId) return;
            const currentRevision = ++messageRevision;
            const saved = MessageAssembler.toEntityFromResource(response.data);
            const index = messages.value.findIndex(message => message.id === saved.id);
            if (index === -1) messages.value.push(saved);
            else messages.value[index] = saved;
            pendingSince.value = null;
            try {
                const refreshed = await api.getMessages(payload.contactId);
                if (currentGeneration === generation && currentRevision === messageRevision && activeContactId.value === payload.contactId) {
                    messages.value = MessageAssembler.toEntitiesFromResponse(refreshed);
                    pendingSince.value = refreshed.pendingSince;
                }
            } catch (error) { if (currentGeneration === generation) uiStore.notify(apiErrorMessage(error)); }
        }).catch(error => {
            if (currentGeneration === generation && ['GmailReconnect', 'GmailNotConnected'].includes(error.response?.data?.code)) gmail.value.connected = false;
            throw error;
        });
    }

    function reset() { generation++; gmailRequestId++; messageRevision++; requestId++; messages.value = []; pendingSince.value = null; activeContactId.value = null; loading.value = false; syncing.value = false; gmail.value = { configured: false, connected: false, email: null, canManage: false }; }

    return reactive({ messages, pendingSince, loading, activeContactId, gmail, syncing, loadGmail, connectGmail, disconnectGmail, fetchMessages, sendMessage, reset });
})();

export function useConversationsStore() { return store; }
