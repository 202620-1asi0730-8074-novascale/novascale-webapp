import { createRouter, createWebHistory } from 'vue-router'
import authenticationRoutes from './authentication/presentation/authentication-routes.js'
import leadsRoutes from './leads/presentation/leads-routes.js'
import dashboardRoutes from './dashboard/presentation/dashboard-routes.js'
import conversationsRoutes from './conversations/presentation/conversations-routes.js'
import { watch } from 'vue'
import { useI18n } from './i18n.js'

const PageNotFound = () => import('./shared/presentation/views/page-not-found.vue')
const { locale, t } = useI18n()
const titleKeys = { login: 'login', signup: 'signup', 'forgot-password': 'recovery', settings: 'settings', dashboard: 'dashboard', reports: 'reports', leads: 'leads', customers: 'customers', pipeline: 'pipeline', conversations: 'conversations' }
const titleFor = route => `${titleKeys[route.name] ? t(titleKeys[route.name]) : 'NovaLeads'} | NovaLeads`

const router = createRouter({
    history: createWebHistory(),
    routes: [
        ...authenticationRoutes, ...dashboardRoutes,
        { path: '/leads', name: 'leads-module', children: leadsRoutes },
        { path: '/conversations', name: 'conversations-module', children: conversationsRoutes },
        { path: '/', redirect: '/login' },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: PageNotFound }
    ]
})

router.beforeEach((to, from, next) => {
    document.title = titleFor(to)
    const isAuthenticated = Boolean(sessionStorage.getItem('novaleads.demoUserId'))
    if (to.meta.requiresAuth && !isAuthenticated) next({ name: 'login' })
    else next()
})
watch(locale, () => { document.title = titleFor(router.currentRoute.value) })
export default router
