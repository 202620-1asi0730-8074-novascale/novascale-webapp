import { ref, reactive } from "vue";
import { ConversationsApi } from "../infrastructure/conversations-api.js";
import { MessageAssembler } from "../infrastructure/message.assembler.js";
import { useLeadsStore } from "../../../../../Downloads/NovaLeads/src/leads/application/leads.store.js";
import { useAuthenticationStore } from "../../../../../Downloads/NovaLeads/src/authentication/application/authentication.store.js";

const api = new ConversationsApi();

const store = (() => {
    const leadsStore = useLeadsStore();
    const authStore = useAuthenticationStore();
    const messages = ref([]);
    const activeContactId = ref(null);

    function fetchMessages(contactId) {
        if (!contactId || !leadsStore.contacts.some(c => c.id === contactId)) {
            messages.value = [];
            return Promise.resolve();
        }
        return api.getMessages(contactId).then(response => {
            if (activeContactId.value === contactId) messages.value = MessageAssembler.toEntitiesFromResponse(response);
        }).catch(console.error);
    }

    function sendMessage(text) {
        if (!leadsStore.contacts.some(c => c.id === activeContactId.value)) return Promise.reject(new Error('Este contacto no pertenece a tu perfil.'));
        const payload = { contactId: activeContactId.value, ownerId: authStore.profile.id, text, sender_type: 'out', sent_at: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) };
        return api.sendMessage(payload).then(response => {
            messages.value.push(MessageAssembler.toEntityFromResource(response.data));
        });
    }

    function reset() { messages.value = []; activeContactId.value = null; }

    return reactive({ messages, activeContactId, fetchMessages, sendMessage, reset });
})();

export function useConversationsStore() { return store; }
