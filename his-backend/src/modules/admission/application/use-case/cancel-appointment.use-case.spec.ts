import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { CancelAppointmentUseCase, CancelAppointmentCommand } from './cancel-appointment.use-case';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';
import { BookedState } from '../../domain/states/appointment.state';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('CancelAppointmentUseCase', () => {
    let useCase: CancelAppointmentUseCase;
    let mockRepository: jest.Mocked<IAppointmentRepository>;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            save: jest.fn(),
            updateStatus: jest.fn(),
            findPrevious: jest.fn(),
            findByDoctorId: jest.fn(),
            hasTimeConflict: jest.fn(),
        } as unknown as jest.Mocked<IAppointmentRepository>;

        mockEventEmitter = {
            emit: jest.fn(),
        } as unknown as jest.Mocked<EventEmitter2>;

        useCase = new CancelAppointmentUseCase(mockRepository, mockEventEmitter);
    });

    it('debe cancelar el turno, guardarlo y emitir el evento', async () => {
        // 1. ARRANGE (Organizar)
        const appointmentId = 'b6056dc2-c9f7-4f11-addc-72313ee24a00';
        const command = new CancelAppointmentCommand(appointmentId);

        const existingAppointment = new Appointment(
            appointmentId, 'doc-1', new Date(), new Date(), 'pat-1', new BookedState(), 1, false
        );

        mockRepository.findById.mockResolvedValue(existingAppointment);
        mockRepository.save.mockResolvedValue(undefined);

        // 2. ACT (Actuar)
        await useCase.execute(command);

        // 3. ASSERT (Afirmar)
        expect(mockRepository.save).toHaveBeenCalledWith(existingAppointment);
        expect(mockRepository.save).toHaveBeenCalledTimes(1);

        expect(mockEventEmitter.emit).toHaveBeenCalledWith(
            'appointment.cancelled',
            expect.any(Object)
        );
    });
});