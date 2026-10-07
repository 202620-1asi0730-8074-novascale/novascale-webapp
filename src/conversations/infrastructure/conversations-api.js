import { BaseApi } from '../../../../../Downloads/NovaLeads/src/shared/infrastructure/base-api.js'
import { currentUserId, requireOwner, demoError } from '../../../../../Downloads/NovaLeads/src/authentication/infrastructure/demo-session.js'
export class ConversationsApi extends BaseApi {
    async checkContact(contactId) {
        const { data } = await this.http.get('/contacts/' + encodeURIComponent(contactId))
        requireOwner(data.ownerId)
    }
    async getMessages(contactId) {
        await this.checkContact(contactId)
        return this.http.get('/messages', { params: { contactId } })
    }
    async sendMessage(payload) {
        await this.checkContact(payload.contactId)
        const text = String(payload.text || '').trim()
        if (!text) throw demoError(400, 'Escribe un mensaje.')
        return this.http.post('/messages', { ...payload, text,
            ownerId: currentUserId(), sender_type: 'out' })
    }
}

