import { BaseApi } from '../../shared/infrastructure/base-api.js'
import { hashPassword, verifyPassword } from './demo-password.js'
import { currentUserId, requireOwner, demoError, publicProfile } from './demo-session.js'
export class AuthenticationApi extends BaseApi {
    async getUsers() {
        const response = await this.http.get('/users')
        return { ...response, data: response.data.map(publicProfile) }
    }
    async getProfile() {
        const response = await this.http.get('/users/' + encodeURIComponent(currentUserId()))
        return { ...response, data: publicProfile(response.data) }
    }
    async login(email, password) {
        const normalized = String(email || '').trim().toLowerCase()
        const response = await this.http.get('/users')
        const user = response.data.find(item => item.email.toLowerCase() === normalized)
        if (!user || !await verifyPassword(String(password || ''), user.passwordHash)) {
            throw demoError(401, 'Correo o contraseña incorrectos.')
        }
        return { data: { user: publicProfile(user) } }
    }
    async register(resource) {
        const name = String(resource.name || '').trim()
        const company = String(resource.company || '').trim()
        const email = String(resource.email || '').trim().toLowerCase()
        const password = String(resource.password || '')
        if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
            throw demoError(400, 'Completa los campos y usa al menos 8 caracteres de contraseña.')
        }
        const passwordHash = await hashPassword(password)
        const users = await this.http.get('/users')
        if (users.data.some(user => user.email.toLowerCase() === email)) throw demoError(409, 'Ese correo ya está registrado.')
        const response = await this.http.post('/users', {
            name, company, email, passwordHash,
            role: 'Vendedor', quota: 0, plan: 'Demo', phone: '', tags: []
        })
        return { ...response, data: { user: publicProfile(response.data) } }
    }
    logout() { return Promise.resolve() }
    async changePassword(currentPassword, newPassword) {
        const path = '/users/' + encodeURIComponent(currentUserId())
        const { data: user } = await this.http.get(path)
        if (!await verifyPassword(String(currentPassword || ''), user.passwordHash)) throw demoError(401, 'La contraseña actual es incorrecta.')
        if (String(newPassword || '').length < 8) throw demoError(400, 'Usa al menos 8 caracteres.')
        await this.http.patch(path, { passwordHash: await hashPassword(newPassword) })
        return { data: { ok: true } }
    }
    async updateUser(id, resource) {
        requireOwner(id)
        const name = String(resource.name || '').trim()
        const company = String(resource.company || '').trim()
        if (!name || !company) throw demoError(400, 'Nombre y empresa son obligatorios.')
        const response = await this.http.patch('/users/' + encodeURIComponent(id), {
            name, company, quota: Math.max(0, Number(resource.quota) || 0)
        })
        return { ...response, data: publicProfile(response.data) }
    }
}

