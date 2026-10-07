import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { AvailableState, BookedState, WaitingRoomState, CompletedState, CancelledState } from '../../domain/states/appointment.state';

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
            case 'ATENDIDO': state = new CompletedState(); break;
            case 'CANCELADO': state = new CancelledState(); break;
            default: state = new AvailableState();
        }

        // Mapeo: ORM -> Dominio
        return new Appointment(
            ormEntity.id,
            ormEntity.doctorId,
            ormEntity.startTime,
            ormEntity.patientId,
            state,
            ormEntity.version
        );
    }

    async save(appointment: Appointment): Promise<void> {
        // Mapeo: Dominio -> ORM
        const ormEntity = this.ormRepository.create({
            id: appointment.id ?? undefined,
            doctorId: appointment.doctorId ?? undefined,
            startTime: appointment.startTime,
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
}