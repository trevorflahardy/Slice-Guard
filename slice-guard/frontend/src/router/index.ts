import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authState, tryRefresh } from '../services/auth'

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
        name: 'LabHome',
        component: () => import('../views/LabView.vue'),
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

router.beforeEach(async (to) => {
  if (to.name === 'Login' || to.name === 'Register') return true

  if (!authState.accessToken && authState.refreshToken) {
    try {
      await tryRefresh()
    } catch {
      return { name: 'Login' }
    }
  }

  if (!authState.accessToken) {
    return { name: 'Login' }
  }

  return true
})

export default router
