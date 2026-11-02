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
        redirect: () => {
          const authStore = useAuthStore();
          return authStore.userRole === 'CLEANER' ? '/beds' : '/billing';
        },
      },
      {
        path: 'billing',
        name: 'Billing',
        component: () => import('../../modules/billing/views/BillingView.vue'),
      },
      {
        path: 'admission',
        name: 'Admission',
        component: () => import('../../modules/admission/views/ReceptionView.vue'),
      },
      {
        path: 'triage',
        name: 'Triage',
        component: () => import('../../modules/admission/views/TriageView.vue'),
      },
      {
        path: 'doctor-agenda',
        name: 'Doctor-agenda',
        component: () => import('../../modules/admission/views/DoctorAgendaView.vue'),
      },
      {
        path: 'beds',
        name: 'Beds',
        component: () => import('../../modules/beds/views/BedManagementView.vue'),
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../../modules/inventory/views/InventoryView.vue'),
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
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../../modules/inventory/views/InventoryView.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return next(authStore.userRole === 'CLEANER' ? '/beds' : '/billing');
  }

  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles && (!authStore.userRole || !allowedRoles.includes(authStore.userRole))) {
    return next(authStore.userRole === 'CLEANER' ? '/beds' : '/billing');
  }

  next();
});

export default router;