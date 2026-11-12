import { BaseApi } from '../../shared/infrastructure/base-api.js'

function roleResource(role) {
    return { ...role, name: role.systemCode === 'OWNER' ? 'Director de ventas' : role.systemCode === 'SELLER' ? 'Vendedor' : role.name }
}
function profileResource(user, metadata) {
    const role = metadata.roles.find(role => role.id === user.roleId)
    const isOwner = role?.systemCode === 'OWNER'
    const codes = metadata.assignments.get(user.roleId) || new Set()
    return {
        id: user.id, name: user.fullName, email: user.email, role: role?.name || '', id_role: user.roleId,
        company: metadata.organization?.name || '', organizationId: metadata.organization?.id,
        phone: user.phone || '', quota: user.quota, status: user.status, isOwner,
        permissions: {
            exportData: user.canExportData && (isOwner || codes.has('export_data')),
            deleteLeads: user.canDeleteLeads && (isOwner || codes.has('delete_contacts')),
            manageUsers: isOwner, manageTags: isOwner || codes.has('manage_tags')
        },
        canExportData: user.canExportData, canDeleteLeads: user.canDeleteLeads
    }
}
export class AuthenticationApi extends BaseApi {
    async getMetadata() {
        const [roles, organizations, permissions] = await Promise.all([
            this.getAllPages('/roles'), this.http.get('/organizations'), this.getAllPages('/permissions')
        ])
        const assignments = new Map(await Promise.all(roles.data.map(async role => {
            const { data } = await this.http.get('/roles/' + role.id + '/permissions')
            return [role.id, new Set(data.map(link => permissions.data.find(permission => permission.id === link.permissionId)?.code))]
        })))
        return { roles: roles.data.map(roleResource), organization: organizations.data[0], assignments }
    }
    async getUsers() {
        const [response, metadata] = await Promise.all([this.getAllPages('/users'), this.getMetadata()])
        return { ...response, data: response.data.map(user => profileResource(user, metadata)) }
    }
    async getProfile() {
        const [response, metadata] = await Promise.all([this.http.get('/authentication/profile'), this.getMetadata()])
        return { ...response, data: profileResource(response.data, metadata) }
    }
    getRoles() { return this.getAllPages('/roles').then(response => ({ ...response, data: response.data.map(roleResource) })) }
    login(email, password) { return this.http.post('/authentication/sign-in', { email: email.trim().toLowerCase(), password }) }
    register(resource) {
        return this.http.post('/authentication/sign-up', {
            fullName: resource.name.trim(), company: resource.company.trim(), email: resource.email.trim().toLowerCase(), password: resource.password
        })
    }
    changePassword(currentPassword, newPassword) { return this.http.put('/authentication/password', { currentPassword, newPassword }) }
    async updateUser(id, resource) {
        await this.http.put('/authentication/profile', {
            fullName: resource.name, phone: resource.phone || '', quota: Number(resource.quota), company: resource.company
        })
        return this.getProfile()
    }
    async saveMember(resource, id = null) {
        const previous = id ? (await this.http.get('/users/' + id)).data : null
        const payload = {
            fullName: resource.name ?? previous?.fullName, email: resource.email ?? previous?.email,
            phone: resource.phone ?? previous?.phone ?? '', quota: resource.quota ?? previous?.quota ?? 0,
            status: resource.status ?? previous?.status ?? 'ACTIVE', roleId: Number(resource.id_role ?? previous?.roleId),
            canExportData: resource.permissions?.exportData ?? resource.canExportData ?? previous?.canExportData ?? true,
            canDeleteLeads: resource.permissions?.deleteLeads ?? resource.canDeleteLeads ?? previous?.canDeleteLeads ?? true
        }
        if (resource.password) payload.password = resource.password
        const response = id ? await this.http.put('/users/' + id, payload) : await this.http.post('/users', payload)
        const metadata = await this.getMetadata()
        return { ...response, data: profileResource(response.data, metadata) }
    }
}
