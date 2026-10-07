import { Controller, Post, Patch, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { BookAppointmentUseCase, BookAppointmentCommand } from '../../application/use-case/book-appointment.use-case';
import { CheckInAppointmentUseCase, CheckInAppointmentCommand } from '../../application/use-case/check-in-appointment.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { IsString, IsNotEmpty } from 'class-validator';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';

// DTO para validar la entrada (Puedes agregar class-validator luego)
export class BookAppointmentDto {
    @IsString()
    @IsNotEmpty()
    appointmentId: string;

    @IsString()
    @IsNotEmpty()
    patientId: string;
}

@Controller('admission')
@UseGuards(RolesGuard)
export class AdmissionController {
    constructor(
        private readonly bookAppointmentUseCase: BookAppointmentUseCase,
        private readonly checkInAppointmentUseCase: CheckInAppointmentUseCase
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
}
