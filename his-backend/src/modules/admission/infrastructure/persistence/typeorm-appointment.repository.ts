import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan, MoreThan, Not } from 'typeorm';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { AvailableState, BookedState, WaitingRoomState, CompletedState, CancelledState, ConsultingRoomState, IAppointmentState } from '../../domain/states/appointment.state';

@Injectable()
export class TypeOrmAppointmentRepository implements IAppointmentRepository {
    constructor(
        @InjectRepository(AppointmentOrmEntity)
        private readonly ormRepository: Repository<AppointmentOrmEntity>,
    ) {}

    async findById(id: string): Promise<Appointment | null> {
        const ormEntity = await this.ormRepository.findOne({ where: { id } });
        if (!ormEntity) return null;

        let state;
        switch (ormEntity.status) {
            case 'RESERVADO': state = new BookedState(); break;
            case 'EN_SALA_DE_ESPERA': state = new WaitingRoomState(); break;
            case 'EN_CONSULTORIO': state = new ConsultingRoomState(); break;
            case 'ATENDIDO': state = new CompletedState(); break;
            case 'CANCELADO': state = new CancelledState(); break;
            default: state = new AvailableState();
        }

        return new Appointment(
            ormEntity.id,
            ormEntity.doctorId,
            ormEntity.startTime,
            ormEntity.endTime,
            ormEntity.patientId,
            state as IAppointmentState,
            ormEntity.version,
            ormEntity.isOverbooking
        );
    }

    async findPrevious(doctorId: string, time: Date): Promise<Appointment | null> {
        const ormEntity = await this.ormRepository.findOne({
            where: {
                doctorId: doctorId,
                startTime: LessThanOrEqual(time),
                endTime: MoreThan(time)
            },
            order: {
                startTime: 'DESC'
            }
        });

        if (!ormEntity) return null;

        let state;
        switch (ormEntity.status) {
            case 'RESERVADO': state = new BookedState(); break;
            case 'EN_SALA_DE_ESPERA': state = new WaitingRoomState(); break;
            case 'EN_CONSULTORIO': state = new ConsultingRoomState(); break;
            case 'ATENDIDO': state = new CompletedState(); break;
            case 'CANCELADO': state = new CancelledState(); break;
            default: state = new AvailableState();
        }

        return new Appointment(
            ormEntity.id,
            ormEntity.doctorId,
            ormEntity.startTime,
            ormEntity.endTime,
            ormEntity.patientId,
            state as IAppointmentState,
            ormEntity.version,
            ormEntity.isOverbooking
        );
    }

    async findByDoctorId(doctorId: string): Promise<Appointment[]> {
        const ormEntities = await this.ormRepository.find({
            where: { doctorId },
            order: { startTime: 'ASC' },
            relations: { patient: true }
        });

        return ormEntities.map(ormEntity => {
                let state;
                switch (ormEntity.status) {
                    case 'RESERVADO': state = new BookedState(); break;
                    case 'EN_SALA_DE_ESPERA': state = new WaitingRoomState(); break;
                    case 'EN_CONSULTORIO': state = new ConsultingRoomState(); break;
                    case 'ATENDIDO': state = new CompletedState(); break;
                    case 'CANCELADO': state = new CancelledState(); break;
                    default: state = new AvailableState();
                }

                const appointment = new Appointment(
                    ormEntity.id,
                    ormEntity.doctorId,
                    ormEntity.startTime,
                    ormEntity.endTime,
                    ormEntity.patientId,
                    state as IAppointmentState,
                    ormEntity.version,
                    ormEntity.isOverbooking
                );

                (appointment as any).patientFullName = ormEntity.patient ? `${ormEntity.patient.firstName} ${ormEntity.patient.lastName}` : 'Desconocido';
                (appointment as any).patientDni = ormEntity.patient?.dni || 'N/A';

                return appointment;
            });
    }

    async hasTimeConflict(doctorId: string, startTime: Date, endTime: Date): Promise<boolean> {
        const count = await this.ormRepository.count({
            where: {
                doctorId: doctorId,
                startTime: LessThan(endTime),
                endTime: MoreThan(startTime),
                status: Not('CANCELADO')
            }
        });
        return count > 0;
    }

    async save(appointment: Appointment): Promise<void> {
        const ormEntity = this.ormRepository.create({
            id: appointment.id ?? undefined,
            doctorId: appointment.doctorId ?? undefined,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            isOverbooking: appointment.isOverbooking,
            patientId: appointment.patientId ?? undefined,
            status: appointment.statusName,
            version: appointment.version ?? undefined,
        });

        try {
            await this.ormRepository.save(ormEntity);
        } catch (error) {
            if (error instanceof Error && error.name === 'OptimisticLockVersionMismatchError') {
                throw new Error('Conflicto de concurrencia: El turno acaba de ser reservado por otro usuario.');
            }
            throw error;
        }
    }

    async updateStatus(id: string, status: string): Promise<void> {
        await this.ormRepository.update(id, { status: status });
    }
}