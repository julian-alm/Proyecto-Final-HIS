import { Injectable, Inject } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';

@Injectable()
export class MoveToWaitingRoomUseCase {
    constructor(@Inject(IAppointmentRepository) private readonly repo: IAppointmentRepository) {}
    async execute(appointmentId: string): Promise<void> {
        await this.repo.updateStatus(appointmentId, 'EN_SALA_DE_ESPERA');
    }
}

@Injectable()
export class CompleteAppointmentUseCase {
    constructor(@Inject(IAppointmentRepository) private readonly repo: IAppointmentRepository) {}
    async execute(appointmentId: string): Promise<void> {
        await this.repo.updateStatus(appointmentId, 'ATENDIDO');
    }
}

@Injectable()
export class MoveToConsultingRoomUseCase {
    constructor(@Inject(IAppointmentRepository) private readonly repo: IAppointmentRepository) {}
    async execute(appointmentId: string): Promise<void> {
        await this.repo.updateStatus(appointmentId, 'EN_CONSULTORIO');
    }
}