<template>
  <div class="app-layout">
    <!-- Barra Lateral -->
    <aside class="sidebar">
      <div class="brand">
        <h2>HIS Hospital</h2>
        <span class="role-badge">{{ authStore.userRole }}</span>
      </div>

      <div class="user-info">
        <p>{{ authStore.userFullName }}</p>
      </div>

      <nav class="nav-links">
        <!-- Exclusivo para ADMIN -->
        <router-link 
          v-if="authStore.isAdmin" 
          to="/users" 
          class="nav-item">
          Registrar Personal (IAM)
        </router-link>

        <!-- Recepción / Admin / Médico / Enfermero -->
        <router-link 
          v-if="['ADMIN', 'RECEPCIONIST', 'DOCTOR', 'NURSE'].includes(authStore.userRole || '')" 
          to="/admission" 
          class="nav-item">
          Registrar Pacientes
        </router-link>

        <!-- Recepción / Enfermería / Médicos -->
        <router-link 
          v-if="['ADMIN', 'RECEPCIONIST', 'NURSE', 'DOCTOR'].includes(authStore.userRole || '')" 
          to="/triage" 
          class="nav-item">
          Asignación y Triaje
        </router-link>

        <!-- Incluye a CLEANER para pasar camas de En Limpieza -> Disponible -->
        <router-link 
          v-if="['ADMIN', 'NURSE', 'RECEPCIONIST', 'CLEANER'].includes(authStore.userRole || '')" 
          to="/beds" 
          class="nav-item">
          Camas e Inventario
        </router-link>

        <!-- Personal Clínico y Admin -->
        <router-link 
          v-if="['ADMIN', 'DOCTOR', 'NURSE'].includes(authStore.userRole || '')" 
          to="/nursing" 
          class="nav-item">
          Enfermería y HCE
        </router-link>

        <!-- Administrativo y Facturación -->
        <router-link 
          v-if="['ADMIN', 'RECEPCIONIST'].includes(authStore.userRole || '')" 
          to="/billing" 
          class="nav-item">
          Facturación
        </router-link>
      </nav>

      <button @click="handleLogout" class="btn-logout">
        Cerrar Sesión
      </button>
    </aside>

    <!-- Contenido Dinámico de cada Módulo -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../modules/iam/store/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.brand h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
}

.role-badge {
  background-color: #3498db;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.user-info {
  margin: 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid #34495e;
  font-size: 0.9rem;
  color: #bdc3c7;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.nav-item:hover,
.nav-item.router-link-active {
  background-color: #34495e;
  color: #3498db;
  font-weight: bold;
}

.btn-logout {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-logout:hover {
  background-color: #c0392b;
}

.main-content {
  flex: 1;
  background-color: #f4f6f8;
  padding: 2rem;
  overflow-y: auto;
}
</style>