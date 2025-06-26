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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
