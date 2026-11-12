import axios from 'axios'
import { useI18n } from '../../i18n.js'
import { sessionKey, clearSession } from '../../authentication/infrastructure/session.js'

export function apiErrorMessage(error, fallback = 'apiError') {
    const { t } = useI18n()
    const body = error.response?.data
    if (error.response?.status < 500 && body && typeof body === 'object') {
        const messages = Object.values(body.errors || {}).flat().filter(message => typeof message === 'string')
        if (messages.length) return [...new Set(messages)].join(' ')
        if (typeof body.title === 'string') return body.title
    }
    return t(fallback)
}

export function utcDate(value) {
    return value && value.includes('T') && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value + 'Z' : value
}

export class BaseApi {
    constructor() {
        this.http = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5285/api/v1',
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        })
        this.http.interceptors.request.use(config => {
            const { locale } = useI18n()
            config.headers['Accept-Language'] = locale.value === 'en' ? 'en' : 'es'
            const token = sessionStorage.getItem(sessionKey)
            config.sessionToken = token
            if (token) config.headers.Authorization = 'Bearer ' + token
            return config
        })
        this.http.interceptors.response.use(response => {
            if (response.config.sessionToken && response.config.sessionToken !== sessionStorage.getItem(sessionKey))
                return Promise.reject(new axios.CanceledError('Session changed'))
            return response
        }, error => {
            if (error.config?.sessionToken && error.config.sessionToken !== sessionStorage.getItem(sessionKey))
                return Promise.reject(new axios.CanceledError('Session changed'))
            const protectedRequest = !/authentication\/sign-(in|up)/.test(error.config?.url || '')
            if (error.response?.status === 401 && error.response.data?.code !== 'InvalidCredentials' && protectedRequest && error.config?.sessionToken === sessionStorage.getItem(sessionKey) && sessionStorage.getItem(sessionKey)) {
                clearSession()
                window.dispatchEvent(new Event('novaleads:unauthorized'))
            }
            return Promise.reject(error)
        })
    }
    async getAllPages(path, params = {}) {
        const rows = []
        let response
        let page = 1
        do {
            response = await this.http.get(path, { params: { ...params, page, pageSize: 100 } })
            if (Array.isArray(response.data)) return response
            rows.push(...response.data.items)
            if (rows.length >= response.data.total || !response.data.items.length) break
            page++
        } while (page <= 100000)
        return { ...response, data: rows }
    }
}
