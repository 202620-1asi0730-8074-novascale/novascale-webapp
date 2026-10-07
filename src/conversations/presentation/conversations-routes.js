const ConversationsView = () => import('./views/conversations-view.vue')

export default [
    { path: '', name: 'conversations', component: ConversationsView, meta: { title: 'Conversaciones', requiresAuth: true } }
];