const PipelineView = () => import('./views/pipeline-view.vue')
const ContactsView = () => import('./views/contacts-view.vue')

export default [
    { path: 'pipeline', name: 'pipeline', component: PipelineView, meta: { title: 'Pipeline', requiresAuth: true } },
    { path: 'directory', name: 'leads', component: ContactsView, props: { leads: true }, meta: { title: 'Leads', requiresAuth: true } },
    { path: 'customers', name: 'customers', component: ContactsView, props: { leads: false }, meta: { title: 'Clientes', requiresAuth: true } }
];