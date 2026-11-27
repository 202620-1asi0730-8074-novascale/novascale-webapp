export function isValidMoney(value) {
    if (!['string', 'number'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return false
    if (typeof value === 'string') {
        const text = value.trim().toLowerCase()
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(text)) return false
        const [mantissa, exponentText = '0'] = text.split('e')
        const exponent = Number(exponentText)
        if (!Number.isSafeInteger(exponent)) return false
        const decimals = mantissa.split('.')[1]?.length || 0
        const digits = mantissa.replace(/[+.\-]/g, '').replace(/^0+/, '')
        const trailingZeros = digits.length - digits.replace(/0+$/, '').length
        if (digits && decimals - exponent - trailingZeros > 2) return false
    }
    const amount = Number(value)
    return Number.isFinite(amount) && amount >= 0 && amount <= 9999999999.99 && Math.round(amount * 100) / 100 === amount
}

export function parseMoney(value) {
    if (!isValidMoney(value)) throw new RangeError('InvalidAmount')
    return Number(value)
}

export function isValidRequiredText(value, maximum) {
    if (typeof value !== 'string' || value.trim().length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(value)) return false
    return value.replace(/[\p{Cf}\p{Cc}\p{M}\p{Z}\s]/gu, '').length > 0
}

export function contactTags(value) {
    return [...new Set(value.split(',').map(tag => tag.trim()).filter(Boolean))]
}

export function areValidContactTags(value) {
    if (typeof value !== 'string') return false
    const tags = contactTags(value)
    return tags.length <= 30 && tags.every(tag => isValidRequiredText(tag, 50))
}
