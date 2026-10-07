export class Contact {
    constructor({ id = null, ownerId = null, owner = '', name = '', company = '', email = '', phone = '', source = '', type = 'lead', stage = 'new', value = 0, priority = 'Media', tags = [] }) {
        this.id = id; this.ownerId = ownerId; this.owner = owner; this.name = name; this.company = company; this.email = email; this.phone = phone; this.source = source; this.type = type; this.stage = stage; this.value = value; this.priority = priority; this.tags = tags;
    }
}
