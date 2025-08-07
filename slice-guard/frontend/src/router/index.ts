import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Root',
        component: () => import('../views/RootRedirect.vue'),
    },
    {
        path: '/dms',
        name: 'DmsHome',
        component: () => import('../views/DmsHomeView.vue'),
    },
    {
        path: '/lab',
        component: () => import('../views/lab/LabMainRoute.vue'),
        children: [
            {
                path: 'create',
                name: 'CreateLab',
                component: () => import('../views/CreateLabView.vue'),
            },
            {
                path: ':id',
                component: () => import('../views/lab/LabLayout.vue'),
                children: [
                    {
                        path: '',
                        name: 'LabDashboard',
                        component: () => import('../views/lab/LabDashboard.vue'),
                    },
                    {
                        path: 'print-requests',
                        name: 'LabPrintRequests',
                        component: () => import('../views/lab/print_requests/LabPrintRequests.vue'),
                    },
                    {
                        path: 'channels/:channelId',
                        name: 'LabChannel',
                        component: () => import('../views/lab/channels/ChannelView.vue'),
                    },
                ],
            },
        ],
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/auth/LoginPage.vue'),
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/auth/RegisterPage.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const auth = useAuthStore();
    if (to.name === 'Login' || to.name === 'Register') {
        if (auth.apiKey) {
            return { name: 'Root' };
        }
        return true;
    }
    if (!auth.apiKey) {
        return { name: 'Login' };
    }
    return true;
});

export default router;
