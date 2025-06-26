import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/lab',
    name: 'Lab',
    component: () => import('../layouts/lab/LabLayout.vue'),
    children: [
      {
        path: '/lab/dashboard',
        name: 'LabDashboard',
        component: () => import('../layouts/lab/LabDashboard.vue'),
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../layouts/login/LoginPage.vue'),
    children: [
      {
        path: '/login/create-account',
        name: 'CreateAccount',
        component: () => import('../layouts/login/CreateAccountPage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
