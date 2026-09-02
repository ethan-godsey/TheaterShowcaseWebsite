import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import store from '../store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },

    // Admin routes are lazy-loaded: visitors never download this code.
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('../views/CallbackView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

/*
 * This guard is UX, not security. It decides what to render; it protects
 * nothing. Anyone can open devtools and call the API directly — which is why
 * requireAuth on the server is the actual control. Never treat a route guard
 * as an access check.
 */
router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true
  if (store.getters['auth/isAuthenticated']) return true
  return { name: 'login' }
})

export default router
