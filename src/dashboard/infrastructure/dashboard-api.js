import { BaseApi } from '../../shared/infrastructure/base-api.js'
import { requireOwner } from '../../authentication/infrastructure/demo-session.js'
export class DashboardApi extends BaseApi {
    async getActivities(ownerId) {
        requireOwner(ownerId)
        const response = await this.http.get('/activities', { params: { ownerId } })
        response.data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        return response
    }
}

