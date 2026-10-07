import scrypt from 'scrypt-js'
// Keeps the existing db.json passwords compatible, without resetting accounts.
const encode = text => new TextEncoder().encode(text)
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
async function derive(password, salt) {
    return hex(await scrypt.scrypt(encode(password), encode(salt), 16384, 8, 1, 64))
}
export async function hashPassword(password) {
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
    return salt + ':' + await derive(password, salt)
}
export async function verifyPassword(password, stored = '') {
    const [salt, expected] = stored.split(':')
    if (!salt || !/^[a-f0-9]{128}$/i.test(expected || '')) return false
    return await derive(password, salt) === expected
}

