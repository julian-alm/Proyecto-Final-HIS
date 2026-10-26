<template>
  <div class="app-layout">
    <!-- Barra Lateral -->
    <aside class="sidebar">
      
      <!-- Brand -->
      <div class="brand">
        <div class="brand-icon">+</div>
        <div class="brand-text">
          <h2>HIS Hospital</h2>
          <span>Sistema de Información</span>
        </div>
      </div>

      <!-- User Card -->
      <div class="user-card">
        <div class="user-avatar">{{ getInitials(authStore.userFullName) }}</div>
        <div class="user-details">
          <p class="user-name">{{ authStore.userFullName || 'Usuario' }}</p>
          <p class="user-role">Rol: {{ authStore.userRole }}</p>
        </div>
      </div>

      <!-- Navegación -->
      <nav class="nav-links">
        <span class="nav-group-title">GENERAL</span>
        
        <span class="nav-group-title mt-2">OPERACIÓN CLÍNICA</span>
        
        <router-link 
          v-if="authStore.isAdmin" 
          to="/users" 
          class="nav-item">
          <span class="material-symbols-rounded nav-icon">badge</span>
          Registrar Personal (IAM)
        </router-link>

        <router-link 
          v-if="['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'].includes(authStore.userRole || '')" 
          to="/admission" 
          class="nav-item">
          <span class="material-symbols-rounded nav-icon">assignment_ind</span>
          Admisión y Triaje
        </router-link>

        <router-link 
          v-if="['ADMIN', 'NURSE', 'RECEPTIONIST', 'CLEANER'].includes(authStore.userRole || '')" 
          to="/beds" 
          class="nav-item">
          <span class="material-symbols-rounded nav-icon">bed</span>
          Gestión de Camas
        </router-link>

        <router-link 
          v-if="['ADMIN', 'NURSE', 'RECEPTIONIST'].includes(authStore.userRole || '')" 
          to="/inventory" 
          class="nav-item">
          <span class="material-symbols-rounded nav-icon">inventory_2</span>
          Inventario
        </router-link>

        <router-link 
          v-if="['ADMIN', 'DOCTOR', 'NURSE'].includes(authStore.userRole || '')" 
          to="/nursing" 
          class="nav-item">
          <span class="material-symbols-rounded nav-icon">medical_services</span>
          Enfermería y HCE
        </router-link>

        <router-link 
          v-if="['ADMIN', 'RECEPTIONIST'].includes(authStore.userRole || '')" 
          to="/billing" 
          class="nav-item">
          <span class="material-symbols-rounded nav-icon">receipt_long</span>
          Facturación
        </router-link>
      </nav>

      <!-- Botón de Cerrar Sesión -->
      <button @click="handleLogout" class="btn-logout">
        <span class="material-symbols-rounded nav-icon">logout</span>
        Cerrar Sesión
      </button>
    </aside>

    <!-- Contenedor Principal (Ya sin el Top Bar inútil) -->
    <div class="main-wrapper">
      <main class="main-content">
        <router-view />
      </main>
    </div>
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

const getInitials = (name?: string | null) => {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

/* --- BARRA LATERAL --- */
.sidebar {
  width: 260px;
  background-color: #0f172a; /* Color azul oscuro forzado */
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-sizing: border-box;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background-color: #0aa28a;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.brand-text h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.brand-text span {
  font-size: 0.75rem;
  color: #94a3b8;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background-color: #3b82f6;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
}

.user-role {
  margin: 0;
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.nav-group-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}

.mt-2 { margin-top: 1rem; }

.nav-item {
  color: #94a3b8;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Espacio entre icono y texto */
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-icon {
  font-size: 1.25rem;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* Cuando el item está activo, el icono se rellena para destacar más */
.nav-item.router-link-active .nav-icon {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* ESTADO ACTIVO (Módulo actual) */
.nav-item.router-link-active {
  background-color: rgba(10, 162, 138, 0.15);
  color: #0aa28a;
  font-weight: 600;
}

.btn-logout {
  background-color: transparent;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-top: auto;
}

.btn-logout:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* --- CONTENEDOR PRINCIPAL --- */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f4f7f6; /* Color de fondo general restaurado */
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>