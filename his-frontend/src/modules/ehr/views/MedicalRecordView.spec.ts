import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MedicalRecordView from './MedicalRecordView.vue';
import { AdmissionService } from '../../admission/services/admission.service';
import { createTestingPinia } from '@pinia/testing';
import { useRoute } from 'vue-router';

// ARRANGE: Aislamos el componente (Principio Hermético)
vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() }))
}));

vi.mock('../../admission/services/admission.service', () => ({
  AdmissionService: { getAssignedPatients: vi.fn() }
}));

describe('MedicalRecordView - Seguridad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe bloquear el acceso si el médico intenta ver un paciente no asignado', async () => {
    // Simulamos que el doc quiso espiar el DNI "99999999" por la URL
    (useRoute as any).mockReturnValue({ params: { dni: '99999999' } });
    
    // Simulamos que el backend le dice "tu lista de asignados está vacía"
    (AdmissionService.getAssignedPatients as any).mockResolvedValue({ data: [] });

    // ACT: Montamos la vista simulando que somos un DOCTOR logueado
    const wrapper = mount(MedicalRecordView, {
      global: {
        plugins: [createTestingPinia({ initialState: { auth: { userRole: 'DOCTOR' } } })]
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 50)); // Esperamos al onMounted

    // ASSERT: Evaluamos el HTML (Caja Negra). Debe estar la pantalla bloqueada pidiendo buscar.
    expect(wrapper.text()).toContain('Ingresá el DNI de un paciente');
  });
});