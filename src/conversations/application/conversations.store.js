import { apiErrorMessage } from "../../shared/infrastructure/base-api.js";
import { ref, reactive } from "vue";
import { ConversationsApi } from "../infrastructure/conversations-api.js";
import { MessageAssembler } from "../infrastructure/message.assembler.js";
import { useLeadsStore } from "../../leads/application/leads.store.js";
import { useAuthenticationStore } from "../../authentication/application/authentication.store.js";
import { useUiStore } from "../../shared/application/ui.store.js";
import { useI18n } from "../../i18n.js";
const api = new ConversationsApi();

const store = (() => {
    const leadsStore = useLeadsStore();
    const authStore = useAuthenticationStore();
    const uiStore = useUiStore();
    const { t } = useI18n();
    let requestId = 0;
    const messages = ref([]);
    const pendingSince = ref(null);
    const loading = ref(false);
    const activeContactId = ref(null);

    function fetchMessages(contactId) {
        const currentRequest = ++requestId;
        messages.value = [];
        pendingSince.value = null;
        loading.value = false;
        if (!contactId || !leadsStore.contacts.some(c => c.id === contactId)) {
            messages.value = [];
            return Promise.resolve();
        }
        loading.value = true;
        return api.getMessages(contactId).then(response => {
            if (currentRequest === requestId && activeContactId.value === contactId) {
                messages.value = MessageAssembler.toEntitiesFromResponse(response);
                pendingSince.value = response.pendingSince;
            }
        }).catch(error => {
            if (currentRequest === requestId) uiStore.notify(apiErrorMessage(error));
        }).finally(() => {
            if (currentRequest === requestId) loading.value = false;
        });
    }

    function sendMessage(text, attachments = []) {
        if (!leadsStore.contacts.some(c => c.id === activeContactId.value)) return Promise.reject(new Error(t('noOwner')));
        const payload = { attachments, contactId: activeContactId.value, ownerId: authStore.profile.id, text, sender_type: 'out', sent_at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) };
        return api.sendMessage(payload).then(async response => {
            if (activeContactId.value !== payload.contactId) return;
            messages.value.push(MessageAssembler.toEntityFromResource(response.data));
            pendingSince.value = null;
            try {
                const refreshed = await api.getMessages(payload.contactId);
                if (activeContactId.value === payload.contactId) {
                    messages.value = MessageAssembler.toEntitiesFromResponse(refreshed);
                    pendingSince.value = refreshed.pendingSince;
                }
            } catch (error) { uiStore.notify(apiErrorMessage(error)); }
        });
    }

    function reset() { requestId++; messages.value = []; pendingSince.value = null; activeContactId.value = null; loading.value = false; }

    return reactive({ messages, pendingSince, loading, activeContactId, fetchMessages, sendMessage, reset });
})();

export function useConversationsStore() { return store; }
