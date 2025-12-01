// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '/src/shared/presentation/components/layouts/AppLayout.vue';
import { authGuard } from '/src/modules/iam/services/authGuard.js';

const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('/src/modules/iam/presentation/components/LoginView.vue'),
        meta: {
            title: 'Iniciar Sesión',
            requiresAuth: false
        }
    },
    {
        path: '/',
        component: AppLayout,
        redirect: '/clientes',
        meta: {
            requiresAuth: true
        },
        children: [
            {
                path: 'clientes',
                name: 'clientes',
                component: () => import('/src/modules/clientes/presentation/views/ClientesView.vue'),
                meta: {
                    title: 'Gestión de Clientes',
                    requiresAuth: true
                }
            },
            {
                path: 'clientes-NCMV',
                name: 'clientes-NCMV',
                component: () => import('/src/modules/clientes-mivivienda/presentation/views/ClientesMIView.vue'),
                meta: {
                    title: 'Gestión de Clientes NCMV',
                    requiresAuth: true
                }
            },
            {
                path: 'simulador',
                name: 'simulador',
                component: () => import('/src/modules/simulador/presentation/views/SimuladorView.vue'),
                meta: {
                    title: 'Simulador de Financiamiento',
                    requiresAuth: true
                }
            },
            {
                path: 'historial',
                name: 'historial',
                component: () => import('/src/modules/simulador/presentation/views/HistorialView.vue'),
                meta: {
                    title: 'Historial de Simulaciones',
                    requiresAuth: true
                }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('/src/shared/presentation/components/NotFound.vue'),
        meta: {
            title: 'Página No Encontrada'
        }
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

// Navigation Guards
router.beforeEach((to, from, next) => {
    // Set page title
    document.title = to.meta.title
        ? `${to.meta.title} - EasyHome`
        : 'EasyHome';

    // Aplicar guard de autenticación
    authGuard(to, from, next);
});

// After navigation
router.afterEach(() => {
    // Scroll to top after each navigation
    window.scrollTo(0, 0);
});

export default router;