export type BedStateName = 'LIBRES' | 'OCUPADAS' | 'EN_LIMPIEZA' | 'BLOQUEADAS';

export interface BedItem {
  id: string; // Ej: "CAMA-101"
  roomNumber: string;
  status: BedStateName; // El backend nos mandará el statusName acá
  patientId: string | null;
  patientFullName?: string | null;
  patientDni?: string | null;
}

export interface PatientLookup {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
}