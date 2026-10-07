import es from './locales/es.json'
import en from './locales/en.json'
import { ref } from 'vue'

const locale = ref(localStorage.getItem('novaleads.locale') === 'en' ? 'en' : 'es')
const messages = { es, en }

function setLocale(value) {
  locale.value = value === 'en' ? 'en' : 'es'
  localStorage.setItem('novaleads.locale', locale.value)
  document.documentElement.lang = locale.value
}
document.documentElement.lang = locale.value
function t(key, params = {}) {
  let result = messages[locale.value][key] || messages.es[key] || key
  for (const [name, value] of Object.entries(params)) result = result.replaceAll(`{${name}}`, String(value))
  return result
}
export function useI18n() { return { locale, setLocale, t } }

export const money = value => new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'es-PE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
