import { Controller, Post, Patch, Get, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { BookAppointmentUseCase, BookAppointmentCommand } from '../../application/use-case/book-appointment.use-case';
import { CheckInAppointmentUseCase, CheckInAppointmentCommand } from '../../application/use-case/check-in-appointment.use-case';
import { AddTriageUseCase, AddTriageCommand } from '../../application/use-case/add-triage.use-case';
import { GetNextTriageUseCase } from '../../application/use-case/get-next-triage.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { IsString, IsNotEmpty } from 'class-validator';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { CancelAppointmentUseCase, CancelAppointmentCommand } from '../../application/use-case/cancel-appointment.use-case';
import { InsertEntreturnoUseCase, InsertEntreturnoCommand } from '../../application/use-case/insert-entreturno.use-case';
import { GetDoctorAgendaUseCase } from '../../application/use-case/get-doctor-agenda.use-case';
import { MoveToWaitingRoomUseCase } from '../../application/use-case/change-appointment-status.use-cases';
import { CompleteAppointmentUseCase } from '../../application/use-case/change-appointment-status.use-cases';
import { MoveToConsultingRoomUseCase } from '../../application/use-case/change-appointment-status.use-cases';

export class BookAppointmentDto {
    @IsString()
    @IsNotEmpty()
    appointmentId: string;

    @IsString()
    @IsNotEmpty()
    patientId: string;
}

export class CreateAppointmentDto {
    @IsString() @IsNotEmpty() doctorId: string;
    @IsString() @IsNotEmpty() patientId: string;
    @IsNotEmpty() startTime: string;
}

export class AddTriageDto {
    @IsString() @IsNotEmpty() patientId: string;
    @IsNotEmpty() level: number;
    @IsString() @IsNotEmpty() symptoms: string;
}

export class InsertEntreturnoDto {
    @IsString() @IsNotEmpty() doctorId: string;
    @IsString() @IsNotEmpty() patientId: string;
    @IsNotEmpty() startTime: string;
}

@Controller('admission')
@UseGuards(RolesGuard)
export class AdmissionController {
    constructor(
        private readonly bookAppointmentUseCase: BookAppointmentUseCase,
        private readonly checkInAppointmentUseCase: CheckInAppointmentUseCase,
        private readonly addTriageUseCase: AddTriageUseCase,
        private readonly getNextTriageUseCase: GetNextTriageUseCase,
        private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
        private readonly insertEntreturnoUseCase: InsertEntreturnoUseCase,
        private readonly getDoctorAgendaUseCase: GetDoctorAgendaUseCase,
        private readonly moveToWaitingRoomUseCase: MoveToWaitingRoomUseCase,
        private readonly completeAppointmentUseCase: CompleteAppointmentUseCase,
        private readonly moveToConsultingRoomUseCase: MoveToConsultingRoomUseCase,
    ) {}

    @Post('appointments')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    async bookAppointment(@Body() dto: CreateAppointmentDto) {
    try {
        await this.bookAppointmentUseCase.execute(
            new BookAppointmentCommand(dto.doctorId, dto.patientId, new Date(dto.startTime))
        );
        return { message: 'Turno programado reservado con éxito.' };
    } catch (error: any) {
        throw new HttpException(error.message || 'Error al reservar el turno', HttpStatus.CONFLICT);
    }
}

    @Patch('appointments/:id/check-in')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
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
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE)
    async addToTriage(@Body() dto: AddTriageDto) {
        const entryId = await this.addTriageUseCase.execute(
            new AddTriageCommand(dto.patientId, dto.level, dto.symptoms)
        );
        return { message: 'Paciente ingresado a triaje', triageId: entryId };
    }

    @Post('triage/next')
    @Roles(UserRole.ADMIN, UserRole.DOCTOR)
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
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST) 
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

    @Post('appointments/entreturno')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    async insertEntreturno(@Body() dto: InsertEntreturnoDto) {
        try {
            await this.insertEntreturnoUseCase.execute(
                new InsertEntreturnoCommand(dto.doctorId, dto.patientId, new Date(dto.startTime))
            );
            return { message: 'Entreturno insertado y agenda ajustada con éxito.' };
        } catch (error) {
            if (error instanceof DomainException) {
                throw new HttpException(error.message, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('appointments/doctor/:doctorId')
    @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
    async getDoctorAgenda(@Param('doctorId') doctorId: string) {
        const appointments = await this.getDoctorAgendaUseCase.execute(doctorId);
        
        return {
            status: 'success',
            data: appointments.map((apt: any) => ({
                id: apt.id,
                startTime: apt.startTime,
                endTime: apt.endTime,
                status: apt.statusName,
                isOverbooking: apt.isOverbooking,
                patientId: apt.patientId,
                patientFullName: apt.patientFullName,
                patientDni: apt.patientDni
            }))
        };
    }

    @Patch('appointments/:id/waiting-room')
    @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.NURSE)
    async moveToWaitingRoom(@Param('id') id: string) {
        await this.moveToWaitingRoomUseCase.execute(id);
        return { message: 'Turno actualizado a EN_SALA_DE_ESPERA' };
    }

    @Patch('appointments/:id/complete')
    @Roles(UserRole.DOCTOR, UserRole.ADMIN)
    async completeAppointment(@Param('id') id: string) {
        await this.completeAppointmentUseCase.execute(id);
        return { message: 'Turno actualizado a ATENDIDO' };
    }

    @Patch('appointments/:id/consulting-room')
    @Roles(UserRole.DOCTOR, UserRole.ADMIN)
    async moveToConsultingRoom(@Param('id') id: string) {
        await this.moveToConsultingRoomUseCase.execute(id);
        return { message: 'Turno actualizado a EN_CONSULTORIO' };
    }
}