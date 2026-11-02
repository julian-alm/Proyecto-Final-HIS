import { Appointment } from '../entities/appointment.entity';

export const IAppointmentRepository = Symbol('IAppointmentRepository');

export interface IAppointmentRepository {
    findById(id: string): Promise<Appointment | null>;
    findPrevious(doctorId: string, time: Date): Promise<Appointment | null>;
    findByDoctorId(doctorId: string): Promise<Appointment[]>;
    hasTimeConflict(doctorId: string, startTime: Date, endTime: Date): Promise<boolean>;
    save(appointment: Appointment): Promise<void>;
    updateStatus(id: string, status: string): Promise<void>;
}