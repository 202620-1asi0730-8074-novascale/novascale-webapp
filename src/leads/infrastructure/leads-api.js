import { BaseApi } from '../../shared/infrastructure/base-api.js'
import { currentUserId, requireOwner, demoError } from '../../authentication/infrastructure/demo-session.js'
const fields = ['name', 'company', 'email', 'phone', 'type', 'stage', 'value']
function changesBetween(previous, contact) {
    return fields.flatMap(field => {
        const from = field === 'value' ? Number(previous[field] ?? 0) : (previous[field] ?? '')
        const to = field === 'value' ? Number(contact[field] ?? 0) : (contact[field] ?? '')
        return from === to ? [] : [{ field, from, to }]
    })
}
function validate(contact) {
    if (!String(contact.name || '').trim() || !String(contact.email || '').trim() ||
        !['lead', 'customer'].includes(contact.type) || !['new', 'contacted', 'proposal', 'won'].includes(contact.stage) ||
        !Number.isFinite(contact.value)) throw demoError(400, 'Datos del contacto inválidos.')
}
export class LeadsApi extends BaseApi {
    getContacts(ownerId) {
        requireOwner(ownerId)
        return this.http.get('/contacts', { params: { ownerId } })
    }
    async recordActivity(response, eventType, changes = []) {
        const contact = response.data
        const event = { ownerId: contact.ownerId, contactId: contact.id,
            contactName: contact.name, eventType, stage: contact.stage, value: contact.value,
            changes, createdAt: new Date().toISOString() }
        try {
            await this.http.post('/activities', event)
        } catch {
            response.activityError = true
        }
        return response
    }
    async createContact(resource) {
        const contact = { ...resource, ownerId: currentUserId(),
            type: resource.type === 'customer' ? 'customer' : 'lead', stage: resource.stage || 'new', value: Number(resource.value ?? 0) }
        delete contact.id
        validate(contact)
        const response = await this.http.post('/contacts', contact)
        return this.recordActivity(response, contact.type === 'customer' ? 'customer_created' : 'lead_created')
    }
    async updateContact(id, resource) {
        const path = '/contacts/' + encodeURIComponent(id)
        const { data: previous } = await this.http.get(path)
        requireOwner(previous.ownerId)
        const contact = { ...previous, ...resource, id: previous.id, ownerId: previous.ownerId,
            value: Number(resource.value ?? previous.value) }
        validate(contact)
        const changes = changesBetween(previous, contact)
        if (!changes.length) return { data: previous }
        const patch = Object.fromEntries(changes.map(change => [change.field, change.to]))
        const response = await this.http.patch(path, patch)
        return this.recordActivity(response, changes.some(change => change.field === 'stage') ? 'stage_changed' : 'contact_updated', changes)
    }
}

