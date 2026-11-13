import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TriageView from './TriageView.vue';
import { AdmissionService } from '../services/admission.service';

vi.mock('../services/admission.service', () => ({
    AdmissionService: {
        getAllDoctors: vi.fn(),
        getPatientByDni: vi.fn(),
        getDoctorAgenda: vi.fn(),
        bookAppointment: vi.fn(),
        insertEntreturno: vi.fn(),
        addToTriage: vi.fn(),
        moveToWaitingRoom: vi.fn(),
        cancelAppointment: vi.fn(),
    }
}));

describe('TriageView.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (AdmissionService.getAllDoctors as any).mockResolvedValue({
            data: { data: [{ id: 'doc-1', userId: 'user-doc-1', specialty: 'Clínica', user: { fullName: 'Dr. Test' } }] }
        });
    });

    it('debe buscar un paciente y habilitar los formularios de asignación', async () => {
        // 1. ARRANGE
        (AdmissionService.getPatientByDni as any).mockResolvedValue({
            data: { id: 'patient-1', firstName: 'Juan', lastName: 'Perez' }
        });
        const wrapper = mount(TriageView);
        await flushPromises();

        // 2. ACT
        const searchInput = wrapper.find('.search-bar input');
        await searchInput.setValue('12345678');
        await wrapper.find('.btn-search').trigger('click');
        await flushPromises();

        // 3. ASSERT
        expect(AdmissionService.getPatientByDni).toHaveBeenCalledWith('12345678');
        expect(wrapper.text()).toContain('Juan Perez');
        // Verificamos que la clase disabled-grid desaparezca al encontrar al paciente
        expect(wrapper.find('.forms-grid').classes()).not.toContain('disabled-grid');
    });

    it('debe registrar un turno normal correctamente', async () => {
        // 1. ARRANGE
        (AdmissionService.getPatientByDni as any).mockResolvedValue({
            data: { id: 'patient-1', firstName: 'Juan', lastName: 'Perez' }
        });
        (AdmissionService.bookAppointment as any).mockResolvedValue({});
        (AdmissionService.getDoctorAgenda as any).mockResolvedValue({ data: { data: [] } });

        const wrapper = mount(TriageView);
        await flushPromises();

        // Act - Buscamos paciente
        await wrapper.find('.search-bar input').setValue('12345678');
        await wrapper.find('.btn-search').trigger('click');
        await flushPromises();

        // 2. ACT - Asignamos turno
        await wrapper.find('select').setValue('user-doc-1');
        await wrapper.find('input[type="date"]').setValue('2026-11-20');
        await wrapper.find('input[type="time"]').setValue('10:00');

        // Forzamos el envío del formulario de turnos
        await wrapper.findAll('form')[0].trigger('submit');
        await flushPromises();

        // 3. ASSERT
        expect(AdmissionService.bookAppointment).toHaveBeenCalled();
        expect(wrapper.html()).toContain('Turno programado reservado con éxito');
    });

    it('debe registrar un ingreso a triaje correctamente', async () => {
         // 1. ARRANGE
        (AdmissionService.getPatientByDni as any).mockResolvedValue({
            data: { id: 'patient-1', firstName: 'Juan', lastName: 'Perez' }
        });
        (AdmissionService.addToTriage as any).mockResolvedValue({});

        const wrapper = mount(TriageView);
        await flushPromises();

        await wrapper.find('.search-bar input').setValue('12345678');
        await wrapper.find('.btn-search').trigger('click');
        await flushPromises();

        // 2. ACT
        // Seleccionamos de forma resiliente usando la clase del panel contenedor
        const triageForm = wrapper.find('.triage-panel form');

        await triageForm.find('input').setValue('Dolor de pecho');
        await triageForm.find('select').setValue('1');
        await triageForm.trigger('submit');
        await flushPromises();

        // 3. ASSERT
        expect(AdmissionService.addToTriage).toHaveBeenCalledWith({
            patientId: 'patient-1',
            level: 1,
            symptoms: 'Dolor de pecho'
        });
        expect(wrapper.html()).toContain('Paciente ingresado a Triaje');
    });
});