import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { InsertEntreturnoUseCase, InsertEntreturnoCommand } from './insert-entreturno.use-case';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';
import { WaitingRoomState, ConsultingRoomState, IAppointmentState } from '../../domain/states/appointment.state';
import { ConflictException } from '@nestjs/common';

describe('InsertEntreturnoUseCase', () => {
    let useCase: InsertEntreturnoUseCase;
    let mockRepository: jest.Mocked<IAppointmentRepository>;

    beforeEach(() => {
        mockRepository = {
            findPrevious: jest.fn(),
            save: jest.fn(),
            // Las demás funciones deben estar declaradas como jest.fn() para satisfacer la interfaz
            findById: jest.fn(),
            findByDoctorId: jest.fn(),
            hasTimeConflict: jest.fn(),
            updateStatus: jest.fn(),
        } as unknown as jest.Mocked<IAppointmentRepository>;

        useCase = new InsertEntreturnoUseCase(mockRepository);
    });

    it('debe acortar el turno previo e insertar el entreturno si el estado es EN_SALA_DE_ESPERA', async () => {
        // 1. ARRANGE (Organizar)
        const command = new InsertEntreturnoCommand('doc-1', 'pat-2', new Date('2026-11-01T09:15:00Z'));
        
        const previousAppointment = new Appointment(
            'apt-1', 'doc-1', new Date('2026-11-01T09:00:00Z'), new Date('2026-11-01T09:30:00Z'), 
            'pat-1', new WaitingRoomState(), 1, false
        );
        mockRepository.findPrevious.mockResolvedValue(previousAppointment);

        // 2. ACT (Actuar)
        await useCase.execute(command);

        // 3. ASSERT (Afirmar)
        expect(mockRepository.save).toHaveBeenCalledTimes(2);
        expect(previousAppointment.endTime).toEqual(new Date('2026-11-01T09:15:00Z')); 
    });

    it('debe lanzar ConflictException si el turno original ya está EN_CONSULTORIO', async () => {
        // 1. ARRANGE (Organizar)
        const command = new InsertEntreturnoCommand('doc-1', 'pat-2', new Date('2026-11-01T09:15:00Z'));
        
        const previousAppointment = new Appointment(
            'apt-1', 'doc-1', new Date('2026-11-01T09:00:00Z'), new Date('2026-11-01T09:30:00Z'), 
            'pat-1', new ConsultingRoomState() as unknown as IAppointmentState, 1, false
        );
        mockRepository.findPrevious.mockResolvedValue(previousAppointment);

        // 2. ACT & 3. ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(ConflictException);
        expect(mockRepository.save).not.toHaveBeenCalled();
    });
});