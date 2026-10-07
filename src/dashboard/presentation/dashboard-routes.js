const DashboardView = () => import('./views/dashboard-view.vue')
const ReportsView = () => import('./views/reports-view.vue')
const PlansView = () => import('./views/plans-view.vue')

export default [
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard', requiresAuth: true } },
    { path: '/reports', name: 'reports', component: ReportsView, meta: { title: 'Reportes', requiresAuth: true } },
    { path: '/pricing', name: 'pricing', component: PlansView }
];
