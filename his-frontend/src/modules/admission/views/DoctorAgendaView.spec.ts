import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DoctorAgendaView from './DoctorAgendaView.vue';
import { AdmissionService } from '../services/admission.service';
import { createPinia } from 'pinia';
import { useAuthStore } from '../../iam/store/auth.store';

vi.mock('../services/admission.service', () => ({
    AdmissionService: {
        getDoctorAgenda: vi.fn(),
        moveToConsultingRoom: vi.fn(),
        completeAppointment: vi.fn()
    }
}));

describe('DoctorAgendaView.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe renderizar correctamente la agenda y mostrar el botón Llamar si el estado es EN_SALA_DE_ESPERA', async () => {
        // 1. ARRANGE
        (AdmissionService.getDoctorAgenda as any).mockResolvedValue({
            data: {
                data: [{
                    id: 'apt-1',
                    startTime: new Date().toISOString(),
                    patientFullName: 'Juan Pérez',
                    status: 'EN_SALA_DE_ESPERA',
                    isOverbooking: false
                }]
            }
        });

        // CLAVE: Instanciamos Pinia y configuramos el usuario ANTES de montar el componente
        const testingPinia = createPinia();
        const authStore = useAuthStore(testingPinia);
        authStore.userId = 'doctor-1';
        authStore.userFullName = 'Dr. House';

        // Ahora montamos el componente, que ya tendrá acceso al ID del doctor en su onMounted
        const wrapper = mount(DoctorAgendaView, {
            global: { plugins: [testingPinia] }
        });

        // 2. ACT
        await flushPromises();

        // 3. ASSERT
        expect(wrapper.text()).toContain('Juan Pérez');
        expect(wrapper.find('button.btn-call').exists()).toBe(true);
        expect(wrapper.find('button.btn-finish').exists()).toBe(false);
    });

    it('debe abrir el modal de confirmación, llamar al servicio y cerrar el modal al finalizar una consulta', async () => {
        // 1. ARRANGE
        (AdmissionService.getDoctorAgenda as any).mockResolvedValue({
            data: {
                data: [{
                    id: 'apt-2',
                    startTime: new Date().toISOString(),
                    patientFullName: 'Ana Gómez',
                    status: 'EN_CONSULTORIO',
                    isOverbooking: false
                }]
            }
        });
        (AdmissionService.completeAppointment as any).mockResolvedValue({});

        // Configuramos Pinia ANTES de montar
        const testingPinia = createPinia();
        const authStore = useAuthStore(testingPinia);
        authStore.userId = 'doctor-1';

        const wrapper = mount(DoctorAgendaView, {
            global: { plugins: [testingPinia] }
        });

        await flushPromises();

        expect(wrapper.find('tbody tr').classes()).toContain('row-status-en_consultorio');

        // 2. ACT
        await wrapper.find('button.btn-finish').trigger('click');
        expect(wrapper.find('.modal-content').exists()).toBe(true);

        await wrapper.find('.btn-confirm').trigger('click');
        await flushPromises();

        // 3. ASSERT
        expect(AdmissionService.completeAppointment).toHaveBeenCalledWith('apt-2');
        expect(wrapper.html()).toContain('Consulta finalizada correctamente');
        expect(wrapper.find('.modal-content').exists()).toBe(false);
    });
});