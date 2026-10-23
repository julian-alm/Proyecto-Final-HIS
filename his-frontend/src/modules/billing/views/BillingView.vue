<template>
  <div class="billing-page">
    <div class="page-header">
      <h1>Módulo de Facturación y Aranceles</h1>
      <p>Cálculo de prestaciones médicas por cobertura (Patrón Strategy) y gestión de lista de precios.</p>
    </div>

    <div class="billing-grid">
      <!-- PANEL 1: Calcular Costo de Consulta buscando por DNI -->
      <section class="card">
        <h2>Facturar Consulta Médica</h2>

        <!-- Paso 1: Buscador de Paciente por DNI -->
        <div class="search-box">
          <label for="dniSearch">Buscar Paciente por DNI</label>
          <div class="search-row">
            <input
              id="dniSearch"
              v-model.trim="dniQuery"
              type="text"
              placeholder="Ej: 42123456"
              @keyup.enter="handleSearchPatient"
              :disabled="searchingPatient"
            />
            <button
              type="button"
              class="btn-search"
              @click="handleSearchPatient"
              :disabled="searchingPatient || !dniQuery"
            >
              {{ searchingPatient ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
        </div>

        <!-- Tarjeta de confirmación visual del paciente encontrado -->
        <div v-if="selectedPatient" class="patient-badge">
          <div>
            <strong>{{ selectedPatient.firstName }} {{ selectedPatient.lastName }}</strong>
            <span>DNI: {{ selectedPatient.dni }} · Tipo de Cobertura: {{ selectedPatient.coverageType }}</span>
          </div>
          <button type="button" class="btn-link" @click="clearPatient">Cambiar</button>
        </div>

        <!-- Paso 2: Formulario de Liquidación -->
        <form @submit.prevent="handleCalculate" class="form-layout">
          <div class="form-row">
            <div class="input-group">
              <label for="coverageType">Cobertura a Aplicar</label>
              <select
                id="coverageType"
                v-model="billForm.coverageType"
                required
                :disabled="loadingBill || !selectedPatient"
              >
                <option value="PRIVATE">Particular (100% Paciente)</option>
                <option value="PREPAID">Medicina Prepaga / Obra Social</option>
                <option value="PUBLIC">Cobertura Pública / Estatal</option>
              </select>
            </div>

            <div class="input-group">
              <label for="baseCost">Costo Base Consulta ($)</label>
              <input
                id="baseCost"
                v-model.number="billForm.consultationBaseCost"
                type="number"
                min="0"
                step="0.01"
                required
                :disabled="loadingBill || !selectedPatient"
              />
            </div>
          </div>

          <div v-if="billError" class="alert alert-error">{{ billError }}</div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="loadingBill || !selectedPatient"
          >
            {{ loadingBill ? 'Calculando...' : 'Generar Cargo de Consulta' }}
          </button>
        </form>

        <BillResultCard
          v-if="lastCalculation"
          :result="lastCalculation"
          @clear="lastCalculation = null"
        />
      </section>

      <!-- PANEL 2: ABM de Lista de Precios -->
      <section class="card">
        <h2>Actualizar Precio de Insumo</h2>
        <p class="card-hint">
          Estos valores son consultados automáticamente cuando Enfermería administra medicación.
        </p>

        <form @submit.prevent="handleSavePrice" class="form-layout">
          <div class="input-group">
            <label for="itemName">Nombre Exacto del Medicamento / Insumo</label>
            <input
              id="itemName"
              v-model.trim="priceForm.itemName"
              type="text"
              placeholder="Ej: Ibuprofeno 400mg"
              required
              :disabled="loadingPrice"
            />
          </div>

          <div class="input-group">
            <label for="unitPrice">Precio Unitario ($)</label>
            <input
              id="unitPrice"
              v-model.number="priceForm.unitPrice"
              type="number"
              min="0"
              step="0.01"
              required
              :disabled="loadingPrice"
            />
          </div>

          <div v-if="priceError" class="alert alert-error">{{ priceError }}</div>
          <div v-if="priceSuccess" class="alert alert-success">{{ priceSuccess }}</div>

          <button type="submit" class="btn-secondary" :disabled="loadingPrice">
            {{ loadingPrice ? 'Guardando...' : 'Guardar en Lista de Precios' }}
          </button>
        </form>

        <div v-if="recentPrices.length > 0" class="recent-list">
          <h3>Precios actualizados recientemente</h3>
          <ul>
            <li v-for="(item, index) in recentPrices" :key="`${item.itemName}-${index}`">
              <span>{{ item.itemName }}</span>
              <strong>${{ item.unitPrice }}</strong>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { billingService } from '../services/billing.service';
import BillResultCard from '../components/BillResultCard.vue';
import type {
  BillingCoverageType,
  GenerateBillPayload,
  CreatePricePayload,
  BillCalculationResponse,
  PatientLookup,
} from '../types/billing.types';

// Estado de búsqueda de paciente
const dniQuery = ref('');
const searchingPatient = ref(false);
const selectedPatient = ref<PatientLookup | null>(null);

// Estado del formulario de Facturación
const billForm = reactive<GenerateBillPayload>({
  patientId: '',
  coverageType: 'PRIVATE',
  consultationBaseCost: 15000,
});

const loadingBill = ref(false);
const billError = ref('');
const lastCalculation = ref<BillCalculationResponse | null>(null);

// Estado del formulario de Lista de Precios
const priceForm = reactive<CreatePricePayload>({
  itemName: '',
  unitPrice: 0,
});

const loadingPrice = ref(false);
const priceError = ref('');
const priceSuccess = ref('');
const recentPrices = ref<CreatePricePayload[]>([]);

// Traduce automáticamente español/inglés según cómo esté guardado en EHR
const normalizeCoverage = (raw: string): BillingCoverageType => {
  const upper = (raw || '').toUpperCase().trim();
  if (upper === 'PUBLIC' || upper === 'PUBLICA' || upper === 'PÚBLICA') return 'PUBLIC';
  if (upper === 'PREPAID' || upper === 'PREPAGA' || upper === 'OBRA_SOCIAL') return 'PREPAID';
  return 'PRIVATE';
};

const handleSearchPatient = async () => {
  if (!dniQuery.value) return;
  billError.value = '';
  lastCalculation.value = null;

  try {
    searchingPatient.value = true;
    const patient = await billingService.findPatientByDni(dniQuery.value);
    selectedPatient.value = patient;
    billForm.patientId = patient.id;
    billForm.coverageType = normalizeCoverage(patient.coverageType);
  } catch (error: any) {
    selectedPatient.value = null;
    billForm.patientId = '';
    billError.value =
      error.response?.data?.message || `No se encontró un paciente con DNI ${dniQuery.value}.`;
  } finally {
    searchingPatient.value = false;
  }
};

const clearPatient = () => {
  selectedPatient.value = null;
  billForm.patientId = '';
  dniQuery.value = '';
  lastCalculation.value = null;
};

const handleCalculate = async () => {
  if (!selectedPatient.value) {
    billError.value = 'Primero busca y selecciona un paciente por su DNI.';
    return;
  }

  billError.value = '';
  lastCalculation.value = null;

  try {
    loadingBill.value = true;
    const response = await billingService.calculateConsultation({ ...billForm });
    lastCalculation.value = {
      ...response,
      patientId: selectedPatient.value.id,
      patientFullName: `${selectedPatient.value.firstName} ${selectedPatient.value.lastName}`,
      patientDni: selectedPatient.value.dni,
      coverageType: billForm.coverageType,
    };
  } catch (error: any) {
    const msg = error.response?.data?.message;
    billError.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Error al calcular el costo de la consulta.';
  } finally {
    loadingBill.value = false;
  }
};

const handleSavePrice = async () => {
  priceError.value = '';
  priceSuccess.value = '';

  try {
    loadingPrice.value = true;
    const res = await billingService.savePrice({ ...priceForm });
    priceSuccess.value = res.message || 'Precio guardado correctamente.';

    recentPrices.value.unshift({
      itemName: priceForm.itemName,
      unitPrice: priceForm.unitPrice,
    });

    priceForm.itemName = '';
    priceForm.unitPrice = 0;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    priceError.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Error al actualizar el precio del insumo.';
  } finally {
    loadingPrice.value = false;
  }
};
</script>

<style scoped>
.billing-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.75rem;
}

.page-header h1 {
  margin: 0 0 0.4rem 0;
  color: #2c3e50;
}

.page-header p {
  margin: 0;
  color: #7f8c8d;
}

.billing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.card {
  background: #ffffff;
  padding: 1.75rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.card-hint {
  font-size: 0.88rem;
  color: #7f8c8d;
  margin: 0 0 1.25rem 0;
}

.search-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.search-box label {
  font-size: 0.88rem;
  font-weight: bold;
  color: #34495e;
}

.search-row {
  display: flex;
  gap: 0.5rem;
}

.search-row input {
  flex: 1;
  padding: 0.65rem;
  border: 1px solid #dce1e7;
  border-radius: 6px;
  font-size: 0.95rem;
}

.btn-search {
  background-color: #34495e;
  color: white;
  border: none;
  padding: 0 1.2rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-search:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.patient-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #eafaf1;
  border: 1px solid #a9dfbf;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.1rem;
}

.patient-badge strong {
  display: block;
  color: #1e8449;
  font-size: 0.98rem;
}

.patient-badge span {
  font-size: 0.84rem;
  color: #2c3e50;
}

.btn-link {
  background: none;
  border: none;
  color: #2980b9;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.85rem;
}

.form-layout {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group label {
  font-size: 0.88rem;
  font-weight: bold;
  color: #34495e;
}

.input-group input,
.input-group select {
  padding: 0.65rem;
  border: 1px solid #dce1e7;
  border-radius: 6px;
  font-size: 0.95rem;
}

.btn-primary,
.btn-secondary {
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: bold;
  color: white;
  cursor: pointer;
}

.btn-primary {
  background-color: #3498db;
}

.btn-secondary {
  background-color: #2ecc71;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.alert {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.88rem;
}

.alert-error {
  background-color: #fadbd8;
  color: #c0392b;
}

.alert-success {
  background-color: #d4efdf;
  color: #1e8449;
}

.recent-list {
  margin-top: 1.5rem;
  border-top: 1px solid #ecf0f1;
  padding-top: 1rem;
}

.recent-list h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: #34495e;
}

.recent-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>