/**
 * router/index.js
 *
 * Automatic routes, more info: https://github.com/vuestorefront/vue-router-auto
 */
import { createRouter, createWebHistory } from 'vue-router/auto';
import { routes as autoRoutes } from 'vue-router/auto-routes';
import { useAuthStore } from '../stores/auth';

const customRoutes = [
  { path: '/', redirect: '/login' }
];

const routes = [...customRoutes, ...autoRoutes];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Manejo de errores de importación dinámica
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err);
    } else {
      console.log('Reloading page to fix dynamic import error');
      localStorage.setItem('vuetify:dynamic-reload', 'true');
      location.assign(to.fullPath);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload');
});

// Guardián de rutas para verificar la autenticación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Inicializar el store si aún no se hizo
  if (!authStore.initialized) {
    await authStore.init();
  }

  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (authStore.isAuthenticated && ['/login', '/register'].includes(to.path)) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;