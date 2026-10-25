import { Controller, Get, Patch, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignBedUseCase, AssignBedCommand } from '../../application/use-cases/assign-bed.use-case';
import { DischargeBedUseCase, DischargeBedCommand } from '../../application/use-cases/discharge-bed.use-case';
import { CleanBedUseCase, CleanBedCommand } from '../../application/use-cases/clean-bed.use-case';
import { BlockBedUseCase, BlockBedCommand } from '../../application/use-cases/block-bed.use-case';
import { UnblockBedUseCase, UnblockBedCommand } from '../../application/use-cases/unblock-bed.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { IsString, IsNotEmpty } from 'class-validator';
import { BedOrmEntity } from '../persistence/bed.orm-entity';

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
        private readonly blockBedUseCase: BlockBedUseCase,
        private readonly unblockBedUseCase: UnblockBedUseCase,
        
        // Repositorio inyectado correctamente junto a los demás casos de uso
        @InjectRepository(BedOrmEntity)
        private readonly bedRepo: Repository<BedOrmEntity>,
    ) {}

    @Get()
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR, UserRole.CLEANER)
    async getAllBeds() {
        const beds = await this.bedRepo.query(`
            SELECT b.id, b."roomNumber", b.status, b."patientId", 
                   p."firstName", p."lastName", p.dni
            FROM beds b
            LEFT JOIN patients p ON b."patientId" = p.id::varchar
            ORDER BY b."roomNumber" ASC, b.id ASC
        `);
        
        return beds.map((row: any) => ({
            id: row.id,
            roomNumber: row.roomNumber,
            status: row.status,
            patientId: row.patientId,
            patientFullName: row.firstName ? `${row.firstName} ${row.lastName}` : null,
            patientDni: row.dni || null
        }));
    }

    // No olvides importar BlockBedCommand y UnblockBedCommand arriba

    @Patch(':id/block')
    @Roles(UserRole.ADMIN)
    async blockBed(@Param('id') id: string) {
        // Envolvemos el id en su Command correspondiente
        await this.blockBedUseCase.execute(new BlockBedCommand(id));
        return { message: 'Cama enviada a mantenimiento.' };
    }

    @Patch(':id/unblock')
    @Roles(UserRole.ADMIN)
    async unblockBed(@Param('id') id: string) {
        // Envolvemos el id en su Command correspondiente
        await this.unblockBedUseCase.execute(new UnblockBedCommand(id));
        return { message: 'Cama habilitada nuevamente.' };
    }

    @Patch(':id/assign')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
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

    @Patch(':id/clean')
    @Roles(UserRole.CLEANER, UserRole.ADMIN)
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