export class Message {
    constructor({ id = null, text = '', sender_type = 'out', sent_at = '', contactId = '', attachments = [] }) {
        this.sentAt = sent_at; this.id = id; this.text = text; this.direction = sender_type; this.time = sent_at && /^\d{4}-\d{2}-\d{2}T/.test(sent_at) ? new Date(sent_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : sent_at; this.contactId = contactId; this.attachments = attachments;
    }
}