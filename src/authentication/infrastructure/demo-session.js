// Classroom UI checks. JSON Server itself does not authorize users.
export const sessionKey = 'novaleads.demoUserId'
export function demoError(status, message) {
    return Object.assign(new Error(message), { response: { status, data: { message } } })
}
export function currentUserId() {
    const id = sessionStorage.getItem(sessionKey)
    if (!id) throw demoError(401, 'Inicia sesión de nuevo.')
    return id
}
export function requireOwner(ownerId) {
    if (String(ownerId) !== currentUserId()) throw demoError(403, 'Este registro no pertenece a tu perfil.')
}
export function publicProfile({ passwordHash, password, ...profile }) { return profile }

