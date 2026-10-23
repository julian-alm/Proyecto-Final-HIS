import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../../modules/iam/store/auth.store';
import LoginView from '../../modules/iam/views/LoginView.vue';
import MainLayout from '../../shared/layouts/MainLayout.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/billing', // Redirección por defecto al entrar
      },
      {
        // Tu módulo: Facturación
        path: 'billing',
        name: 'Billing',
        component: () => import('../../modules/billing/views/BillingView.vue'),
      },
      // Rutas preparadas para tus compañeros (redirigen temporalmente a billing hasta que creen sus archivos)
      {
        path: 'admission',
        name: 'Admission',
        redirect: '/billing',
      },
      {
        path: 'beds',
        name: 'Beds',
        redirect: '/billing',
      },
      {
        path: 'nursing',
        name: 'Nursing',
        redirect: '/billing',
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../../modules/iam/views/RegisterUserView.vue'),
        meta: { roles: ['ADMIN'] },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guarda de Navegación Global (Criterio 3 de la Rúbrica)
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // 1. Si la ruta requiere estar logueado y no hay token -> mandar a /login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  // 2. Si ya está logueado e intenta ir a /login -> mandar al panel principal
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/');
  }

  // 3. Validación de autorización por Rol (RBAC en el Frontend)
  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles && (!authStore.userRole || !allowedRoles.includes(authStore.userRole))) {
    // Si no tiene el rol permitido, lo redirigimos a una vista segura según su rol
    return next(authStore.userRole === 'CLEANER' ? '/beds' : '/billing');
  }

  next();
});

export default router;