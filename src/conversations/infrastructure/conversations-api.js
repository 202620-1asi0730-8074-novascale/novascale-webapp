import { BaseApi, utcDate } from '../../shared/infrastructure/base-api.js'

function messageResource(message, contactId) {
    return {
        id: message.id, text: message.content || '', sender_type: message.senderType.toLowerCase(),
        sent_at: utcDate(message.sentAt), contactId,
        attachments: message.attachments.map(file => ({ name: file.name, type: file.contentType, data: file.data }))
    }
}
export class ConversationsApi extends BaseApi {
    async getMessages(contactId) {
        const { data: conversations } = await this.getAllPages('/conversations', { contactId })
        const responses = await Promise.all(conversations.map(conversation => this.getAllPages('/messages', { conversationId: conversation.id })))
        const messages = responses.flatMap(response => response.data).sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id - b.id)
        const pending = conversations.filter(conversation => conversation.status === 'OPEN' && conversation.pendingSince)
            .map(conversation => utcDate(conversation.pendingSince)).sort()
        return { status: 200, data: messages.map(message => messageResource(message, contactId)), pendingSince: pending[0] || null }
    }
    async sendMessage(payload) {
        const { data: contact } = await this.http.get('/contacts/' + encodeURIComponent(payload.contactId))
        const { data: conversations } = await this.getAllPages('/conversations', { contactId: contact.id, status: 'OPEN' })
        const conversation = conversations[0] || (await this.http.post('/conversations', {
            channel: 'SIMULATED', status: 'OPEN', contactId: contact.id, userId: contact.userId
        })).data
        const response = await this.http.post('/messages', {
            senderType: 'OUT', content: payload.text.trim(), conversationId: conversation.id,
            attachments: (payload.attachments || []).map(file => ({ name: file.name, contentType: file.type, data: file.data }))
        })
        return { ...response, data: messageResource(response.data, contact.id) }
    }
}
