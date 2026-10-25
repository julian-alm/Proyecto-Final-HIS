<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { iamService } from '../services/iam.service';
import type { RegisterUserPayload } from '../types/auth.types';

const form = reactive<RegisterUserPayload>({
  fullName: '',
  email: '',
  passwordPlain: '',
  role: '',
});

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Estado para la lista real de usuarios
const usersList = ref<any[]>([]);
const loadingUsers = ref(false);

const loadUsers = async () => {
  loadingUsers.value = true;
  try {
    usersList.value = await iamService.getUsers();
  } catch (error) {
    console.error('Error al cargar la lista de personal', error);
  } finally {
    loadingUsers.value = false;
  }
};

// Cargamos los usuarios apenas entra a la pantalla
onMounted(() => loadUsers());

const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (form.passwordPlain.length < 6) {
    errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }

  try {
    isLoading.value = true;
    await iamService.registerUser({ ...form });

    successMessage.value = `¡Usuario "${form.fullName}" registrado exitosamente!`;

    form.fullName = '';
    form.email = '';
    form.passwordPlain = '';
    form.role = '';

    // Recargamos la lista automáticamente para ver al nuevo usuario
    await loadUsers();
    
  } catch (error: any) {
    const backendMsg = error.response?.data?.message;
    errorMessage.value = Array.isArray(backendMsg)
      ? backendMsg.join(', ')
      : backendMsg || 'No se pudo registrar el usuario. Verifique los datos o el rol.';
  } finally {
    isLoading.value = false;
  }
};

// --- Utilidades de formato para la tabla ---
const getInitials = (name?: string) => {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    DOCTOR: 'Médico/a',
    NURSE: 'Enfermero/a',
    RECEPTIONIST: 'Recepcionista',
    ADMIN: 'Administrador',
    CLEANER: 'Personal de Limpieza'
  };
  return roles[role] || role;
};

// Convierte el isActive (booleano) al texto y clase correctos
const getStatusText = (isActive: boolean) => isActive ? 'Activo' : 'Inactivo';
const getStatusClass = (isActive: boolean) => isActive ? 'dot-active' : 'dot-inactive';
</script>

<template>
  <div class="register-page">
    <div class="page-header">
      <span class="breadcrumb">Operación / Registrar Personal</span>
      <h1>Gestión de Personal (IAM)</h1>
      <p>Alta de nuevos profesionales y administrativos en el sistema hospitalario</p>
    </div>

    <div class="iam-grid">
      <!-- PANEL IZQUIERDO: Formulario de Registro -->
      <div class="card form-card">
        <h2>Registrar nuevo usuario</h2>

        <form @submit.prevent="handleRegister" class="register-form mt-1">
          
          <div class="form-group">
            <label for="fullName">Nombre completo</label>
            <input
              id="fullName"
              v-model.trim="form.fullName"
              type="text"
              placeholder="Ej. Dra. Lucía Fernández"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="email">Correo electrónico institucional</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              placeholder="usuario@hishospital.org"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">Contraseña temporal</label>
              <input
                id="password"
                v-model="form.passwordPlain"
                type="password"
                placeholder="••••••••"
                minlength="6"
                required
                :disabled="isLoading"
              />
              <span class="input-hint">El usuario deberá cambiarla al ingresar</span>
            </div>

            <div class="form-group">
              <label for="role">Rol en el hospital</label>
              <select id="role" v-model="form.role" required :disabled="isLoading">
                <option value="" disabled>Seleccione un rol...</option>
                <option value="DOCTOR">Médico/a</option>
                <option value="NURSE">Enfermero/a</option>
                <option value="RECEPTIONIST">Recepcionista</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
                <!-- Corregido el nombre a Personal de Limpieza -->
                <option value="CLEANER">Personal de Limpieza</option>
              </select>
            </div>
          </div>

          <div v-if="errorMessage" class="alert alert-error mt-1">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="alert alert-success mt-1">
            {{ successMessage }}
          </div>

          <button type="submit" class="btn btn-teal mt-1" :disabled="isLoading">
            {{ isLoading ? 'Procesando...' : '+ Registrar Usuario' }}
          </button>
        </form>
      </div>

      <!-- PANEL DERECHO: Lista de Personal Registrado -->
      <div class="card list-card">
        <div class="list-header">
          <h2>Personal registrado</h2>
          <!-- Contador real conectado a la variable usersList -->
          <span class="badge-count">— {{ usersList.length }} usuarios</span>
        </div>

        <div v-if="loadingUsers" class="loading-state mt-1">Cargando personal...</div>

        <div v-else class="table-responsive mt-1">
          <table class="clean-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>ROL</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <!-- Iteramos sobre los datos reales de la BD -->
              <tr v-for="(user, index) in usersList" :key="user.id">
                <td>
                  <div class="user-info">
                    <div class="avatar" :class="`avatar-${(index % 3) + 1}`">{{ getInitials(user.fullName) }}</div>
                    <div class="user-details">
                      <strong>{{ user.fullName }}</strong>
                      <span>{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="role-text" :class="`role-${(index % 3) + 1}`">{{ formatRole(user.role) }}</span>
                </td>
                <td>
                  <span class="status-indicator">
                    <!-- Conectado al atributo booleano isActive de la BD -->
                    <div class="dot" :class="getStatusClass(user.isActive)"></div>
                    {{ getStatusText(user.isActive) }}
                  </span>
                </td>
              </tr>
              <tr v-if="usersList.length === 0">
                <td colspan="3" class="text-center text-muted py-2">No hay personal registrado aún.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tipografía y layout general */
.register-page {
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

.breadcrumb { font-size: 0.8rem; color: #94a3b8; font-weight: 500; display: block; margin-bottom: 0.25rem; }
.page-header { margin-bottom: 2rem; }
.page-header h1 { margin: 0 0 0.2rem 0; font-size: 1.4rem; font-weight: 700; color: #0f172a; }
.page-header p { margin: 0; color: #64748b; font-size: 0.9rem; }

/* Grid de Pantalla Dividida */
.iam-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .iam-grid {
    grid-template-columns: 1.1fr 1fr; /* Formulario un poco más ancho que la lista */
    align-items: start;
  }
}

/* Tarjetas (Cards) */
.card {
  background: #ffffff;
  padding: 1.75rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.card h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

/* Formulario */
.register-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #334155; }
.input-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem; }

input, select {
  padding: 0.7rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s;
  background-color: white;
}
input:focus, select:focus { border-color: #0aa28a; box-shadow: 0 0 0 3px rgba(10, 162, 138, 0.1); }
input:disabled, select:disabled { background-color: #f8fafc; color: #94a3b8; }
input::placeholder { color: #94a3b8; }

/* Botones */
.btn {
  border: none;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}
.btn-teal { background-color: #0aa28a; color: white; }
.btn-teal:hover:not(:disabled) { background-color: #088b76; }
.btn-teal:disabled { background-color: #cbd5e1; cursor: not-allowed; }

/* Utilidades */
.mt-1 { margin-top: 1rem; }
.text-center { text-align: center; }
.text-muted { color: #94a3b8; }
.py-2 { padding-top: 2rem !important; padding-bottom: 2rem !important; }

/* Alertas y Estados */
.alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; }
.alert-error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.alert-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.loading-state { text-align: center; color: #94a3b8; padding: 2rem; font-size: 0.9rem; }

/* --- PANEL DERECHO (Lista de Personal) --- */
.list-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.badge-count { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }

.table-responsive { overflow-x: auto; width: 100%; }
.clean-table { width: 100%; border-collapse: collapse; }
.clean-table th, .clean-table td {
  padding: 1rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.clean-table th {
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.clean-table tbody tr:last-child td { border-bottom: none; }

/* Perfiles de usuario en tabla */
.user-info { display: flex; align-items: center; gap: 0.75rem; }
.avatar {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700;
}
.avatar-1 { background-color: #eff6ff; color: #2563eb; } /* Azul */
.avatar-2 { background-color: #ecfdf5; color: #059669; } /* Verde */
.avatar-3 { background-color: #fffbeb; color: #d97706; } /* Naranja */

.user-details { display: flex; flex-direction: column; }
.user-details strong { font-size: 0.9rem; color: #0f172a; font-weight: 600; }
.user-details span { font-size: 0.75rem; color: #64748b; }

/* Roles y Estados */
.role-text { font-size: 0.85rem; font-weight: 500; padding: 0.2rem 0.6rem; border-radius: 20px; }
.role-1 { color: #2563eb; } /* Azul */
.role-2 { color: #059669; } /* Verde */
.role-3 { color: #64748b; } /* Gris */

.status-indicator {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.85rem; font-weight: 500; color: #334155;
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-active { background-color: #10b981; } /* Verde para true */
.dot-inactive { background-color: #ef4444; } /* Rojo para false */
</style>