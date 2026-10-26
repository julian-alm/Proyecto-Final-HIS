import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan, MoreThan, Not } from 'typeorm';
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
            ormEntity.endTime,
            ormEntity.patientId,
            state,
            ormEntity.version,
            ormEntity.isOverbooking
        );
    }

    async findPrevious(doctorId: string, time: Date): Promise<Appointment | null> {
        // Busca el turno del doctor cuya hora de inicio sea menor o igual a la hora del entreturno
        const ormEntity = await this.ormRepository.findOne({
            where: {
                doctorId: doctorId,
                startTime: LessThanOrEqual(time),
                status: 'RESERVADO' // Solo afecta turnos ya programados
            },
            order: {
                startTime: 'DESC' // Ordenamos descendente para agarrar el inmediatamente anterior
            }
        });

        if (!ormEntity) return null;

        // Mapeo inverso de estado
        let state;
        switch (ormEntity.status) {
            case 'RESERVADO': state = new BookedState(); break;
            case 'EN_SALA_DE_ESPERA': state = new WaitingRoomState(); break;
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
            state,
            ormEntity.version,
            ormEntity.isOverbooking
        );
    }

    async findByDoctorId(doctorId: string): Promise<Appointment[]> {
        const ormEntities = await this.ormRepository.find({
            where: { doctorId },
            order: { startTime: 'ASC' },
            relations: { patient: true } // <-- CLAVE: Ejecuta el JOIN
        });

        console.log('RESULTADO TYPEORM:', JSON.stringify(ormEntities, null, 2)); // <-- AGREGÁ ESTO

        // Mapeamos la lista de base de datos a Entidades de Dominio
        return ormEntities.map(ormEntity => {
                let state;
                switch (ormEntity.status) {
                    case 'RESERVADO': state = new BookedState(); break;
                    case 'EN_SALA_DE_ESPERA': state = new WaitingRoomState(); break;
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
                    state,
                    ormEntity.version,
                    ormEntity.isOverbooking
                );

                // Inyectamos dinámicamente los datos del paciente para la vista
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
                status: Not('CANCELADO') // Considera ocupado cualquier turno no cancelado
            }
        });
        return count > 0;
    }

    async save(appointment: Appointment): Promise<void> {
        const ormEntity = this.ormRepository.create({
            id: appointment.id ?? undefined,
            doctorId: appointment.doctorId ?? undefined,
            startTime: appointment.startTime,
            endTime: appointment.endTime, // NUEVO
            isOverbooking: appointment.isOverbooking, // NUEVO
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