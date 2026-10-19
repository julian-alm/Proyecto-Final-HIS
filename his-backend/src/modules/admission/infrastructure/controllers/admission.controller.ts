import { Controller, Post, Patch, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { BookAppointmentUseCase, BookAppointmentCommand } from '../../application/use-case/book-appointment.use-case';
import { CheckInAppointmentUseCase, CheckInAppointmentCommand } from '../../application/use-case/check-in-appointment.use-case';
import { AddTriageUseCase, AddTriageCommand } from '../../application/use-case/add-triage.use-case';
import { GetNextTriageUseCase } from '../../application/use-case/get-next-triage.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { IsString, IsNotEmpty } from 'class-validator';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { CancelAppointmentUseCase, CancelAppointmentCommand } from '../../application/use-case/cancel-appointment.use-case';

// DTO para validar la entrada (Puedes agregar class-validator luego)
export class BookAppointmentDto {
    @IsString()
    @IsNotEmpty()
    appointmentId: string;

    @IsString()
    @IsNotEmpty()
    patientId: string;
}

export class AddTriageDto {
    @IsString() @IsNotEmpty() patientId: string;
    @IsNotEmpty() level: number; // 1: Rojo, 2: Amarillo, 3: Verde
    @IsString() @IsNotEmpty() symptoms: string;
}

@Controller('admission')
@UseGuards(RolesGuard)
export class AdmissionController {
    constructor(
        private readonly bookAppointmentUseCase: BookAppointmentUseCase,
        private readonly checkInAppointmentUseCase: CheckInAppointmentUseCase,
        private readonly addTriageUseCase: AddTriageUseCase,
        private readonly getNextTriageUseCase: GetNextTriageUseCase,
        private readonly cancelAppointmentUseCase: CancelAppointmentUseCase
    ) {}

    @Post('appointments/book')
    @Roles(UserRole.RECEPTIONIST)
    async book(@Body() dto: BookAppointmentDto) {
        try {
            await this.bookAppointmentUseCase.execute(
                new BookAppointmentCommand(dto.appointmentId, dto.patientId)
            );
            return { message: 'Turno reservado con éxito' };
        } catch (error) {
            if (error instanceof DomainException || (error instanceof Error && error.message.includes('concurrencia'))) {
                throw new HttpException(error.message, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Patch('appointments/:id/check-in')
    @Roles(UserRole.RECEPTIONIST)
    async checkIn(@Param('id') id: string) {
        try {
            await this.checkInAppointmentUseCase.execute(new CheckInAppointmentCommand(id));
            return { message: 'Paciente anunciado en sala de espera exitosamente' };
        } catch (error) {
            if (error instanceof DomainException || (error instanceof Error && error.message.includes('concurrencia'))) {
                throw new HttpException(error.message, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('triage')
    @Roles(UserRole.RECEPTIONIST, UserRole.NURSE) // Enfermería también puede hacer triaje
    async addToTriage(@Body() dto: AddTriageDto) {
        const entryId = await this.addTriageUseCase.execute(
            new AddTriageCommand(dto.patientId, dto.level, dto.symptoms)
        );
        return { message: 'Paciente ingresado a triaje', triageId: entryId };
    }

    @Post('triage/next')
    @Roles(UserRole.DOCTOR) // Solo el médico llama al siguiente paciente
    async callNextPatient() {
        try {
            const patient = await this.getNextTriageUseCase.execute();
            return { 
                message: 'Llamando paciente', 
                patientId: patient.patientId, 
                symptoms: patient.symptoms,
                level: patient.level
            };
        } catch (error) {
            if (error instanceof DomainException) {
                throw new HttpException(error.message, HttpStatus.NOT_FOUND);
            }
            throw error;
        }
    }

    @Patch('appointments/:id/cancel')
    @Roles(UserRole.RECEPTIONIST) 
    async cancelAppointment(@Param('id') id: string) {
        try {
            await this.cancelAppointmentUseCase.execute(new CancelAppointmentCommand(id));
            return { message: 'Turno cancelado exitosamente. Se ha notificado al sistema de Lista de Espera.' };
        } catch (error) {
            if (error instanceof DomainException) {
                throw new HttpException(error.message, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
