import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TypeOrmDoctorProfileRepository } from '../persistence/typeorm-doctor-profile.repository';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { v4 as uuidv4 } from 'uuid';

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

    // NUEVO ENDPOINT: Recibe el ID del usuario recién creado junto con sus datos médicos
    @Post('doctor-profile')
    @Roles(UserRole.ADMIN)
    async createDoctorProfile(@Body() body: { userId: string; licenseNumber: string; specialty: string }) {
        const profile = {
            id: uuidv4(),
            userId: body.userId,
            licenseNumber: body.licenseNumber,
            specialty: body.specialty
        };
        
        await this.doctorProfileRepository.saveProfile(profile);
        
        return { message: 'Perfil de doctor creado exitosamente', data: profile };
    }
}