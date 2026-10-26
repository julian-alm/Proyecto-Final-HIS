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
    bookAppointment(data: { doctorId: string; patientId: string; startTime: string }) {
        return apiClient.post('/admission/appointments', data);
    },

    // Obtener la cola de triaje (ejemplo)
    getTriageQueue() {
        return apiClient.get('/admission/triage');
    },

    // Obtener todos los turnos del día
    getAppointments() {
        return apiClient.get('/admission/appointments'); 
    },

    // Cancelar turno (el backend disparará el evento PromoteStandbyListener)
    cancelAppointment(appointmentId: string) {
        return apiClient.patch(`/admission/appointments/${appointmentId}/cancel`);
    },

    // Registrar un paciente en triaje (Enfermería)
    addToTriage(data: { patientId: string; level: number; symptoms: string }) {
        return apiClient.post('/admission/triage', data);
    },

    getPatientByDni(dni: string) {
        return apiClient.get(`/ehr/patients/dni/${dni}`);
    },

    getAllDoctors() {
    return apiClient.get('/staff/doctors');
    },

    // Obtener agenda del médico
    getDoctorAgenda(doctorId: string) {
        return apiClient.get(`/admission/appointments/doctor/${doctorId}`);
    },

    // Insertar un entreturno (HU 1.2)
    insertEntreturno(data: { doctorId: string; patientId: string; startTime: string }) {
        return apiClient.post('/admission/appointments/entreturno', data);
    },

    completeAppointment(appointmentId: string) {
        return apiClient.patch(`/admission/appointments/${appointmentId}/complete`);
    }
};