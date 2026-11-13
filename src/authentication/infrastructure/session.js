export const sessionKey = 'novaleads.token'
export const userIdKey = 'novaleads.userId'
export function currentUserId() {
    const value = sessionStorage.getItem(userIdKey)
    return value ? Number(value) : null
}
export function clearSession() {
    sessionStorage.removeItem(sessionKey)
    sessionStorage.removeItem(userIdKey)
}
export function isAuthenticated() {
    const token = sessionStorage.getItem(sessionKey)
    if (!token) return false
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')))
        return Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now()
    } catch { return false }
}
