export function isValidPhone(value) {
    if (value === null || value === undefined) return true
    if (typeof value !== 'string' || value.length > 30 || /[^0-9+ ()\-.]/.test(value)) return false
    if (!value.trim()) return true
    const normalized = value.replace(/[^0-9+]/g, '')
    return /^\+?[0-9]{7,15}$/.test(normalized)
}
