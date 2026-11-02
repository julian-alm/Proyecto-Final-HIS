import { apiClient } from '../../../core/api/axios.client';

export interface PatientDto {
    dni: string;
    firstName: string;
    lastName: string;
    coverageType: string;
}

export const AdmissionService = {
    registerPatient(data: PatientDto) {
        return apiClient.post('/ehr/patients', data);
    },

    bookAppointment(data: { doctorId: string; patientId: string; startTime: string }) {
        return apiClient.post('/admission/appointments', data);
    },

    getTriageQueue() {
        return apiClient.get('/admission/triage');
    },

    getAppointments() {
        return apiClient.get('/admission/appointments'); 
    },

    cancelAppointment(appointmentId: string) {
        return apiClient.patch(`/admission/appointments/${appointmentId}/cancel`);
    },

    addToTriage(data: { patientId: string; level: number; symptoms: string }) {
        return apiClient.post('/admission/triage', data);
    },

    getPatientByDni(dni: string) {
        return apiClient.get(`/ehr/patients/dni/${dni}`);
    },

    getAllDoctors() {
    return apiClient.get('/staff/doctors');
    },

    getDoctorAgenda(doctorId: string) {
        return apiClient.get(`/admission/appointments/doctor/${doctorId}`);
    },

    insertEntreturno(data: { doctorId: string; patientId: string; startTime: string }) {
        return apiClient.post('/admission/appointments/entreturno', data);
    },

    completeAppointment(appointmentId: string) {
        return apiClient.patch(`/admission/appointments/${appointmentId}/complete`);
    },

    moveToWaitingRoom(appointmentId: string) {
        return apiClient.patch(`/admission/appointments/${appointmentId}/waiting-room`);
    },

    moveToConsultingRoom(appointmentId: string) {
        return apiClient.patch(`/admission/appointments/${appointmentId}/consulting-room`);
    }
};