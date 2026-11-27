export function emailReplyText(text) {
    if (typeof text !== 'string') return ''
    const lines = text.replace(/\r\n?/g, '\n').split('\n')
    for (let index = 1; index < lines.length; index++) {
        if (!/^(?:On|El)\s/i.test(lines[index].trim())) continue
        let header = ''
        for (let end = index; end < Math.min(index + 6, lines.length); end++) {
            const line = lines[end].trim()
            if (!line || line.startsWith('>')) break
            header += (header ? ' ' : '') + line
            if (header.length > 1200) break
            if (!/^(?:On\s.+\bwrote:|El\s.+\bescribi[oó]:)\s*$/i.test(header)) continue
            const next = lines.slice(end + 1).find(value => value.trim())
            if (!next?.trimStart().startsWith('>')) break
            const reply = lines.slice(0, index).join('\n').trimEnd()
            if (reply.trim()) return reply
            break
        }
    }
    return text
}
