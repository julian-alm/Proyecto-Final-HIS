import { Appointment } from '../entities/appointment.entity';

export abstract class IAppointmentRepository {
    abstract findById(id: string): Promise<Appointment | null>;
    abstract save(appointment: Appointment): Promise<void>;
    // Para HU 1.1: Reserva con control de concurrencia
    abstract bookAvailableSlotAtomically(appointmentId: string, patientId: string): Promise<Appointment>;
}