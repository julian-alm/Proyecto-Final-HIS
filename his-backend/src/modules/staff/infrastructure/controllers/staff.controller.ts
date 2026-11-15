import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { TypeOrmDoctorProfileRepository } from '../persistence/typeorm-doctor-profile.repository';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { v4 as uuidv4 } from 'uuid';

@Controller('staff')
@UseGuards(RolesGuard)
export class StaffController {
    constructor(
        private readonly doctorProfileRepository: TypeOrmDoctorProfileRepository,
        // Inyectamos el EntityManager acá para las consultas complejas de SQL directo
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) {}

    @Get('doctors')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE)
    async getAllDoctors() {
        const doctors = await this.entityManager.query(`
            SELECT dp.id, u."fullName", dp.specialty 
            FROM doctor_profiles dp 
            JOIN users u ON dp."userId" = u.id
        `);
        return {
            status: 'success',
            data: doctors
        };
    }

@Post('doctors/:doctorId/patients')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async assignPatient(
    @Param('doctorId') doctorId: string,
    @Body('patientId') patientId: string
  ) {
    // Usamos SQL directo para garantizar que se guarde sin errores del ORM
    await this.entityManager.query(`
      INSERT INTO doctor_patient_assignments (id, "doctorProfileId", "patientId", "assignedAt")
      VALUES (gen_random_uuid(), $1, $2, NOW())
    `, [doctorId, patientId]);

    return {
      status: 'success',
      message: 'Paciente asignado al médico exitosamente.'
    };
  }

  // Ruta actualizada para que coincida con el frontend (mis-pacientes) y no dependa del parámetro en la URL
  @Get('doctors/mis-pacientes')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  async getMyPatients(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;

    // Ahora hacemos un JOIN con la tabla patients para traernos el nombre también
    const result = await this.entityManager.query(`
      SELECT dpa."patientId" AS dni, p."firstName", p."lastName"
      FROM doctor_patient_assignments dpa
      JOIN doctor_profiles dp ON dp.id = dpa."doctorId"
      JOIN patients p ON p.dni = dpa."patientId"
      WHERE dp."userId" = $1
    `, [userId]);

    // Ya no devolvemos un array de strings sueltos, devolvemos los objetos completos
    return {
      status: 'success',
      data: result
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