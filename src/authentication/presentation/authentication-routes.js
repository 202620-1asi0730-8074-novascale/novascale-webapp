const AuthView = () => import('./views/auth-view.vue')
const SettingsView = () => import('./views/settings-view.vue')

export default [
    { path: '/login', name: 'login', component: AuthView, meta: { title: 'Iniciar sesión' } },
    { path: '/signup', name: 'signup', component: AuthView, meta: { title: 'Crear cuenta' } },
    { path: '/forgot-password', name: 'forgot-password', component: AuthView, meta: { title: 'Recuperar contraseña' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: 'Configuración', requiresAuth: true } }
];