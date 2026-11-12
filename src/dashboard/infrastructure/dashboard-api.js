import { BaseApi, utcDate } from '../../shared/infrastructure/base-api.js'
export class DashboardApi extends BaseApi {
    async getActivities() {
        const response = await this.getAllPages('/activities')
        const types = { CONTACT_CREATED: 'contact_created', CONTACT_UPDATED: 'contact_updated', OPPORTUNITY_UPDATED: 'opportunity_updated', FOLLOWUP: 'followupScheduled', STAGE_CHANGED: 'stage_changed' }
        return { ...response, data: response.data.map(activity => ({
            id: activity.id, ownerId: activity.userId, contactId: activity.contactId,
            contactName: activity.content, eventType: types[activity.type] || '', text: activity.type === 'FOLLOWUP' ? activity.content : '',
            createdAt: utcDate(activity.createdAt), title: activity.content
        })) }
    }
    getSummary(userId = null) { return this.http.get('/dashboard/summary', { params: { userId } }) }
}
