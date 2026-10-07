export class Activity {
    constructor({ id = null, ownerId = null, title = '', text = '', time = '', color = 'blue', icon = 'bell', contactId = '', contactName = '', eventType = '', createdAt = '', stage = null, value = null, changes = [] }) {
        this.id = id; this.ownerId = ownerId; this.title = title; this.text = text; this.time = time; this.color = color; this.icon = icon; this.contactId = contactId; this.contactName = contactName; this.eventType = eventType; this.createdAt = createdAt;
        this.stage = stage;
        this.value = value;
        this.changes = Array.isArray(changes) ? changes : [];
    }
}
