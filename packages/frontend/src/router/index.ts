import { type RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../views/TestView.vue'),
  },
  {
    path: '/projects',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ProjectOverview',
        component: () => import('../views/OverviewPage.vue'),
      },
      {
        path: 'add',
        name: 'ProjectAdd',
        component: () => import('../views/AddRepo.vue'),
      },
      {
        path: ':projectId/chat',
        name: 'ProjectChat',
        component: () => import('../views/ProjectChat.vue'),
        props: true,
      },
      // Add other routes that use DefaultLayout here
    ],
  },
  // Add other top-level routes as needed
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
