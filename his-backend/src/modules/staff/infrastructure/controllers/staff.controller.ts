import { Controller, Get, UseGuards } from '@nestjs/common';
import { TypeOrmDoctorProfileRepository } from '../persistence/typeorm-doctor-profile.repository';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';

@Controller('staff')
@UseGuards(RolesGuard)
export class StaffController {
    constructor(
        private readonly doctorProfileRepository: TypeOrmDoctorProfileRepository,
    ) {}

    @Get('doctors')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE)
    async getAllDoctors() {
        const doctors = await this.doctorProfileRepository.findAllDoctors();
        return {
            status: 'success',
            data: doctors
        };
    }
}