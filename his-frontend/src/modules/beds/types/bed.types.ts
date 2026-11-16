export type BedStateName = 'LIBRES' | 'OCUPADAS' | 'EN_LIMPIEZA' | 'BLOQUEADAS';

export interface BedItem {
  id: string;
  roomNumber: string;
  status: BedStateName;
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