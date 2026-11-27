import { BaseApi, utcDate } from '../../shared/infrastructure/base-api.js'

function messageResource(message, contactId) {
    return {
        id: message.id, text: message.content || '', sender_type: message.senderType.toLowerCase(),
        sent_at: utcDate(message.sentAt), contactId,
        delivery_status: message.deliveryStatus || 'LOCAL',
        attachments: message.attachments.map(file => ({ name: file.name, type: file.contentType, data: file.data }))
    }
}
export class ConversationsApi extends BaseApi {
    getGmailStatus() { return this.http.get('/integrations/gmail/status') }
    connectGmail() { return this.http.post('/integrations/gmail/connect', {}, { withCredentials: true }) }
    disconnectGmail() { return this.http.delete('/integrations/gmail/connection') }
    syncGmail(contactId) { return this.http.post('/integrations/gmail/contacts/' + encodeURIComponent(contactId) + '/sync', {}, { timeout: 120000 }) }
    async getMessages(contactId) {
        const { data: conversations } = await this.getAllPages('/conversations', { contactId })
        const responses = await Promise.all(conversations.map(conversation => this.getAllPages('/messages', { conversationId: conversation.id })))
        const messages = responses.flatMap(response => response.data).sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id)
        const pending = conversations.filter(conversation => conversation.status === 'OPEN' && conversation.pendingSince)
            .map(conversation => utcDate(conversation.pendingSince)).sort()
        return { status: 200, data: messages.map(message => messageResource(message, contactId)), pendingSince: pending[0] || null }
    }
    async sendMessage(payload) {
        const response = await this.http.post('/integrations/gmail/contacts/' + encodeURIComponent(payload.contactId) + '/send', {
            requestId: payload.requestId, content: payload.text.trim(),
            attachments: (payload.attachments || []).map(file => ({ name: file.name, contentType: file.type, data: file.data }))
        }, { timeout: 120000 })
        return { ...response, data: messageResource(response.data, payload.contactId) }
    }
}
