import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
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

    // 👇 ENDPOINT NUEVO: Asignar un paciente a un doctor (Uso de Recepción/Admin)
    @Post('doctors/:doctorId/patients')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    async assignPatient(
        @Param('doctorId') doctorId: string,
        @Body('patientId') patientId: string
    ) {
        await this.doctorProfileRepository.assignPatientToDoctor(doctorId, patientId);
        return {
            status: 'success',
            message: 'Paciente asignado al médico exitosamente.'
        };
    }

    // 👇 ENDPOINT NUEVO: Obtener los pacientes de un médico (Para la vista "Mis Pacientes")
    @Get('doctors/:doctorId/patients')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
    async getMyPatients(@Param('doctorId') doctorId: string) {
        const patientIds = await this.doctorProfileRepository.getAssignedPatients(doctorId);
        
        return {
            status: 'success',
            data: patientIds // Esto devuelve un array de IDs: ['id-paciente-1', 'id-paciente-2']
        };
    }
    @Post('doctors')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    async createDoctorProfile(@Body() body: { userId: string; licenseNumber: string; specialty: string }) {
        await this.doctorProfileRepository.createProfile(body.userId, body.licenseNumber, body.specialty);
        return {
            status: 'success',
            message: 'Perfil de médico creado y enlazado automáticamente a su usuario.'
        };
    }
}