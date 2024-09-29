import type { RouteLocationNormalized, Router } from 'vue-router'
import { MeApi } from '../client/index.js'
import { useAuth } from '../store/index.js'

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next) => {
    const { isLoggedIn, clearTokens } = useAuth()

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (isLoggedIn()) {
        try {
          // Verify the current user session
          await MeApi.getCurrentUser()
          next()
        } catch (error) {
          console.error('Authentication check failed:', error)
          clearTokens()
          next({ name: 'Login', query: { redirect: to.fullPath } })
        }
      } else {
        next({ name: 'Login', query: { redirect: to.fullPath } })
      }
    } else if (to.name === 'Login' && isLoggedIn()) {
      // Redirect to ProjectOverview if user is already logged in
      next({ name: 'ProjectOverview' })
    } else {
      next()
    }
  })
}
