import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../../modules/iam/store/auth.store';
import LoginView from '../../modules/iam/views/LoginView.vue';
import MainLayout from '../../shared/layouts/MainLayout.vue';

// 1. Helper centralizado para definir la "pantalla de inicio" de cada rol
const getDefaultRouteByRole = (role: string | null): string => {
  switch (role) {
    case 'ADMIN':
      return '/users'; // o '/users', lo que prefieran que vea primero
    case 'NURSE':
      return '/nursing';
    case 'DOCTOR':
      return '/doctor-agenda';
    case 'RECEPTIONIST':
      return '/admission';
    case 'CLEANER':
      return '/beds';
    case 'PATIENT':
      return '/my-history'; // Ruta para el historial médico (la arman después)
    default:
      return '/login';
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  // NUEVA RUTA: Registro público para pacientes
  {
    path: '/register',
    name: 'PatientRegister',
    component: () => import('../../modules/iam/views/PatientRegisterView.vue'),
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
          // Redirige dinámicamente según el rol
          return getDefaultRouteByRole(authStore.userRole);
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
        path: 'nursing',
        name: 'Nursing',
        // Ojo acá: cuando creen la vista de enfermería, cambien este redirect por el import()
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
        component: () => import('../../modules/Inventory/views/InventoryView.vue'),
      },
      {
        // RUTA TEMPORAL PARA EL PACIENTE
        path: 'my-history',
        name: 'PatientHistory',
        // Por ahora lo mandamos a un div vacío o a otra vista segura hasta que armen la historia clínica
        component: () => import('../../modules/iam/views/RegisterUserView.vue'), 
      }
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Si la ruta es privada y no está logueado -> Al Login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  // Si está logueado e intenta ir al login o registro público -> A su página principal
  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    return next(getDefaultRouteByRole(authStore.userRole));
  }

  // Si intenta ir a una ruta protegida y no tiene el rol necesario -> A su página principal
  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles && (!authStore.userRole || !allowedRoles.includes(authStore.userRole))) {
    return next(getDefaultRouteByRole(authStore.userRole));
  }

  next();
});

export default router;