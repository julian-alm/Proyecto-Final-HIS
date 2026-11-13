import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { MoveToWaitingRoomUseCase, MoveToConsultingRoomUseCase, CompleteAppointmentUseCase } from './change-appointment-status.use-cases';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';

describe('ChangeAppointmentStatus Use Cases', () => {
    let mockRepository: jest.Mocked<IAppointmentRepository>;

    beforeEach(() => {
        // 1. ARRANGE GLOBAL: Configuramos el Mock (Test Double) aislando la base de datos
        mockRepository = {
            updateStatus: jest.fn(),
            findById: jest.fn(),
            findPrevious: jest.fn(),
            findByDoctorId: jest.fn(),
            hasTimeConflict: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<IAppointmentRepository>;
    });

    describe('MoveToWaitingRoomUseCase', () => {
        it('debe actualizar el estado del turno a EN_SALA_DE_ESPERA', async () => {
            // 1. ARRANGE
            const useCase = new MoveToWaitingRoomUseCase(mockRepository);
            const appointmentId = 'turno-uuid-1111';
            mockRepository.updateStatus.mockResolvedValue(undefined);

            // 2. ACT
            await useCase.execute(appointmentId);

            // 3. ASSERT: Verificamos que se llamó a la función exacta con los parámetros correctos
            expect(mockRepository.updateStatus).toHaveBeenCalledWith(appointmentId, 'EN_SALA_DE_ESPERA');
            expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
        });
    });

    describe('MoveToConsultingRoomUseCase', () => {
        it('debe actualizar el estado del turno a EN_CONSULTORIO', async () => {
            // 1. ARRANGE
            const useCase = new MoveToConsultingRoomUseCase(mockRepository);
            const appointmentId = 'turno-uuid-1234';
            mockRepository.updateStatus.mockResolvedValue(undefined);

            // 2. ACT
            await useCase.execute(appointmentId);

            // 3. ASSERT
            expect(mockRepository.updateStatus).toHaveBeenCalledWith(appointmentId, 'EN_CONSULTORIO');
            expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
        });
    });

    describe('CompleteAppointmentUseCase', () => {
        it('debe actualizar el estado del turno a ATENDIDO', async () => {
            // 1. ARRANGE
            const useCase = new CompleteAppointmentUseCase(mockRepository);
            const appointmentId = 'turno-uuid-5678';
            mockRepository.updateStatus.mockResolvedValue(undefined);

            // 2. ACT
            await useCase.execute(appointmentId);

            // 3. ASSERT
            expect(mockRepository.updateStatus).toHaveBeenCalledWith(appointmentId, 'ATENDIDO');
            expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
        });
    });
});