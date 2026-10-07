export class Message {
    constructor({ id = null, text = '', sender_type = 'out', sent_at = '', contactId = '' }) {
        this.id = id; this.text = text; this.direction = sender_type; this.time = sent_at; this.contactId = contactId;
    }
}