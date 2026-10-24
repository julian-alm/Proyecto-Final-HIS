import { apiClient } from '../../../core/api/axios.client';

export interface PatientDto {
    dni: string;
    firstName: string;
    lastName: string;
    coverageType: string;
}

export const AdmissionService = {
    // Registrar un nuevo paciente (usa el endpoint que conectamos con EHR)
    registerPatient(data: PatientDto) {
        return apiClient.post('/ehr/patients', data);
    },

    // Agendar un turno
    bookAppointment(data: { patientId: string; doctorId: string; date: string }) {
        return apiClient.post('/admission/appointments', data);
    },

    // Obtener la cola de triaje (ejemplo)
    getTriageQueue() {
        return apiClient.get('/admission/triage');
    }
};