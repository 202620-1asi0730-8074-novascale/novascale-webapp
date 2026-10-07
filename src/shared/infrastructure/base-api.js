import axios from 'axios'
export class BaseApi {
    constructor() {
        this.http = axios.create({
            baseURL: import.meta.env?.VITE_LEARNING_PLATFORM_API_URL || 'http://localhost:3000',
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

