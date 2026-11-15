import axios from 'axios';
import { useAuthStore } from '../../iam/store/auth.store';

// Configuración base de Axios (ajusta el puerto si tu backend no corre en el 3000)
const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor para inyectar el token en cada petición
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

export class EhrNursingService {
  // --- MÓDULO EHR (Historia Clínica) ---
  static registerPatient(payload: any) {
    return apiClient.post('/ehr/patients', payload);
  }

  static getPatientByDni(dni: string) {
    return apiClient.get(`/ehr/patients/dni/${dni}`);
  }

  static createMedicalRecord(patientId: string) {
    return apiClient.post(`/ehr/${patientId}`);
  }

  static addProgressNote(patientId: string, doctorId: string, note: string) {
    return apiClient.post(`/ehr/${patientId}/progress-notes`, { doctorId, note });
  }

  static getMedicalRecord(patientId: string) {
    return apiClient.get(`/ehr/${patientId}`);
  }

  // --- MÓDULO NURSING CARE (Enfermería) ---
  static recordVitalSigns(payload: { patientId: string; temperature: number; bloodPressure: string; heartRate: number }) {
    return apiClient.post('/nursing-care/vital-signs', payload);
  }

  static getVitalSignsHistory(patientId: string) {
  return apiClient.get(`/nursing-care/vital-signs/${patientId}`);
  }

  static generateProtocol(payload: { patientId: string; admissionReason: string }) {
    return apiClient.post('/nursing-care/protocols/generate', payload);
  }

  static administerMedication(payload: { 
  patientId: string; 
  nurseId: string; 
  medicationName: string; 
  dose: string; 
  quantity: number;
  scheduledTime: Date; 
  administeredTime: Date;
}) {
  return apiClient.post('/nursing-care/medication/administer', payload);
}
}