import { Appointment } from '../entities/appointment.entity';

export const IAppointmentRepository = Symbol('IAppointmentRepository');

export interface IAppointmentRepository {
    findById(id: string): Promise<Appointment | null>;
    save(appointment: Appointment): Promise<void>;
}