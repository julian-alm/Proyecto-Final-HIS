import { Controller, Patch, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AssignBedUseCase, AssignBedCommand } from '../../application/use-cases/assign-bed.use-case';
import { DischargeBedUseCase, DischargeBedCommand } from '../../application/use-cases/discharge-bed.use-case';
import { CleanBedUseCase, CleanBedCommand } from '../../application/use-cases/clean-bed.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { IsString, IsNotEmpty } from 'class-validator';

// Decoradores del Módulo IAM
import { RolesGuard } from '../../../iam/infrastructure/guards/roles.guard';
import { Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';

export class AssignBedDto {
    @IsString()
    @IsNotEmpty()
    patientId: string;
}

@Controller('beds')
@UseGuards(RolesGuard)
export class BedManagementController {
    constructor(
        private readonly assignBedUseCase: AssignBedUseCase,
        private readonly dischargeBedUseCase: DischargeBedUseCase,
        private readonly cleanBedUseCase: CleanBedUseCase,
    ) {}

    @Patch(':id/assign')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST) // Solo administrativos y recepcionistas del piso pueden asignar camas
    async assignPatient(@Param('id') id: string, @Body() dto: AssignBedDto) {
        try {
            await this.assignBedUseCase.execute(new AssignBedCommand(id, dto.patientId));
            return { message: 'Cama asignada exitosamente.' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (error instanceof DomainException || errorMessage.includes('concurrencia')) {
                throw new HttpException(errorMessage, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // HU 2.1 - Escenario 1: Alta médica libera al paciente y pasa la cama a EN_LIMPIEZA
    @Patch(':id/discharge')
    @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
    async dischargePatient(@Param('id') id: string) {
        try {
            await this.dischargeBedUseCase.execute(new DischargeBedCommand(id));
            return { message: 'Alta procesada. La cama pasó a estado EN_LIMPIEZA.' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (error instanceof DomainException || errorMessage.includes('concurrencia')) {
                throw new HttpException(errorMessage, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // HU 2.1 - Escenario 2: Personal de maestranza/limpieza confirma higienización y pasa a LIBRES
    @Patch(':id/clean')
    @Roles(UserRole.CLEANER, UserRole.ADMIN) // Si no tienen LIMPIEZA en UserRole, usa ADMINISTRATIVO o ENFERMERO
    async finishCleaning(@Param('id') id: string) {
        try {
            await this.cleanBedUseCase.execute(new CleanBedCommand(id));
            return { message: 'Higienización confirmada. La cama ahora se encuentra LIBRE.' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (error instanceof DomainException || errorMessage.includes('concurrencia')) {
                throw new HttpException(errorMessage, HttpStatus.CONFLICT);
            }
            throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}