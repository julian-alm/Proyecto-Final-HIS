<script setup lang="ts">
import { computed } from 'vue';
import type { BillCalculationResponse } from '../types/billing.types';

const props = defineProps<{
  result: BillCalculationResponse;
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const coverageLabel = computed(() => {
  const map: Record<string, string> = {
    PRIVATE: 'Particular (Privado)',
    PREPAID: 'Obra Social / Prepaga',
    PUBLIC: 'Cobertura Pública / Estatal',
  };
  return props.result.coverageType ? map[props.result.coverageType] || props.result.coverageType : '-';
});

const baseAmount = computed(
  () => props.result.baseCost ?? props.result.consultationBaseCost ?? props.result.totalCost ?? 0
);

const patientPay = computed(
  () => props.result.patientAmount ?? props.result.patientCost ?? props.result.copay ?? 0
);

const thirdPartyPay = computed(
  () => props.result.thirdPartyAmount ?? props.result.thirdPartyCost ?? props.result.coveredAmount ?? 0
);
</script>


<template>
  <div class="result-card">
    <div class="result-header">
      <h3>Comprobante de Liquidación</h3>
      <button type="button" class="btn-clear" @click="emit('clear')">Cerrar</button>
    </div>

    <div class="result-body">
      <p v-if="result.patientFullName">
        <strong>Paciente:</strong> {{ result.patientFullName }}
      </p>
      <p v-if="result.patientDni">
        <strong>DNI:</strong> {{ result.patientDni }}
      </p>
      <p>
        <strong>Cobertura Aplicada:</strong> {{ coverageLabel }}
      </p>
      <hr class="divider" />
      <p><strong>Costo Base de Consulta:</strong> ${{ baseAmount }}</p>
      <p class="highlight-patient">
        <strong>Abona el Paciente:</strong> ${{ patientPay }}
      </p>
      <p class="highlight-third">
        <strong>Cubre Obra Social / Estado:</strong> ${{ thirdPartyPay }}
      </p>
    </div>
  </div>
</template>


<style scoped>
.result-card {
  margin-top: 1.25rem;
  background-color: #f8fbff;
  border: 1px solid #bdd7f5;
  border-left: 5px solid #3498db;
  border-radius: 6px;
  padding: 1.2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.result-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.05rem;
}

.btn-clear {
  background: transparent;
  border: 1px solid #95a5a6;
  color: #7f8c8d;
  border-radius: 4px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  font-size: 0.8rem;
}

.result-body p {
  margin: 0.4rem 0;
  font-size: 0.95rem;
  color: #34495e;
}

.divider {
  border: none;
  border-top: 1px dashed #cbd5e1;
  margin: 0.7rem 0;
}

.highlight-patient {
  color: #d35400 !important;
  font-size: 1rem !important;
}

.highlight-third {
  color: #1e8449 !important;
}
</style>