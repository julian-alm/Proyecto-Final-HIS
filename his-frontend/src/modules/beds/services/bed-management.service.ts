import { apiClient } from '../../../core/api/axios.client';

export interface BedDto {
    id: string;
    roomNumber: string;
    bedNumber: string;
    status: 'LIBRES' | 'OCUPADAS' | 'EN_LIMPIEZA' | 'BLOQUEADAS';
    patientId?: string;
}

export const BedManagementService = {
    // Obtener todas las camas para armar el mapa visual
    getAllBeds() {
        return apiClient.get<BedDto[]>('/bed-management/beds');
    },

    // Asignar paciente a una cama (Pasa a OCCUPIED)
    assignBed(bedId: string, patientId: string) {
        return apiClient.patch(`/bed-management/beds/${bedId}/assign`, { patientId });
    },

    // Dar de alta al paciente (Pasa a CLEANING)
    dischargeBed(bedId: string) {
        return apiClient.patch(`/bed-management/beds/${bedId}/discharge`);
    },

    // Limpiar la cama (Pasa a AVAILABLE)
    cleanBed(bedId: string) {
        return apiClient.patch(`/bed-management/beds/${bedId}/clean`);
    }
};