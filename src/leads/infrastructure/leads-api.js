import { BaseApi, utcDate } from '../../shared/infrastructure/base-api.js'
import { currentUserId } from '../../authentication/infrastructure/session.js'

function contactResource(contact) {
    return {
        id: contact.id, ownerId: contact.userId, owner: contact.owner || '', name: contact.fullName,
        company: contact.company || '', email: contact.email || '', phone: contact.phone || '', source: contact.source || '',
        type: contact.contactType === 'CUSTOMER' ? 'customer' : 'lead', stage: contact.leadStatus.toLowerCase(),
        value: contact.estimatedAmount || 0, tags: contact.tags || [], opportunityId: contact.opportunityId,
        created_at: utcDate(contact.createdAt), won_at: utcDate(contact.wonAt)
    }
}
function payload(resource) {
    return {
        fullName: resource.name, company: resource.company, email: resource.email || '', phone: resource.phone || '',
        contactType: resource.type === 'customer' ? 'CUSTOMER' : 'LEAD', leadStatus: resource.stage.toUpperCase(),
        source: resource.source || '', userId: Number(resource.ownerId || currentUserId()),
        estimatedAmount: Number(resource.value), tags: resource.tags || []
    }
}
export class LeadsApi extends BaseApi {
    async getContacts() {
        const response = await this.getAllPages('/contacts')
        return { ...response, data: response.data.map(contactResource) }
    }
    async createContact(resource) {
        const response = await this.http.post('/contacts', payload(resource))
        return { ...response, data: contactResource(response.data) }
    }
    async updateContact(id, resource) {
        const response = await this.http.put('/contacts/' + encodeURIComponent(id), payload(resource))
        return { ...response, data: contactResource(response.data) }
    }
    deleteContact(id) { return this.http.delete('/contacts/' + encodeURIComponent(id)) }
}
