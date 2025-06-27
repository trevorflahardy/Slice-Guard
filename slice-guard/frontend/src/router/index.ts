import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authState } from '../services/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/nolabs',
    name: 'NoLabs',
    component: () => import('../views/NoLabsView.vue'),
  },
  {
    path: '/lab/:id',
    component: () => import('../layouts/lab/LabLayout.vue'),
    children: [
      {
        path: '',
        name: 'LabDashboard',
        component: () => import('../layouts/lab/LabDashboard.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../layouts/login/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../layouts/register/RegisterPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.name === 'Login' || to.name === 'Register') return true
  if (!authState.apiKey) return { name: 'Login' }
  return true
})

export default router
