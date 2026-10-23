import { Controller, Post, Get, Body, Param, UseGuards, Request, Inject, NotFoundException } from '@nestjs/common';
import { CreateMedicalRecordUseCase } from '../../application/use-cases/create-medical-record.use-case';
import { AddProgressNoteUseCase } from '../../application/use-cases/add-progress-note.use-case';
import { GetMedicalRecordUseCase } from '../../application/use-cases/get-medical-record.use-case';
import { RegisterPatientUseCase } from '../../application/use-cases/register-patient.use-case';
import { RegisterPatientCommand } from '../../application/use-cases/register-patient.use-case';
import { CoverageType } from '../../domain/entities/coverage-type.enum';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { IsString, IsNotEmpty } from 'class-validator';
import { IPatientRepository } from '../../domain/interfaces/patient.repository';

export class RegisterPatientDto {
  @IsString() @IsNotEmpty() dni: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() coverageType: string;
}

@Controller('ehr')
@UseGuards(RolesGuard) // Activamos la seguridad con JWT
export class EhrController {
  constructor(
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    private readonly addProgressNoteUseCase: AddProgressNoteUseCase,
    private readonly getMedicalRecordUseCase: GetMedicalRecordUseCase, // <-- Lo inyectamos acá
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    @Inject(IPatientRepository)
    private readonly patientRepository: IPatientRepository,
  ) {}

  @Post('patients')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST) // El recepcionista registra pacientes
  async registerPatient(@Body() body: RegisterPatientDto) {
    const patientId = await this.registerPatientUseCase.execute(
      new RegisterPatientCommand(body.dni, body.firstName, body.lastName, body.coverageType as CoverageType)
    );
    return { message: 'Paciente registrado exitosamente', patientId };
  }

  // GET /ehr/patients/dni/:dni
  @Get('patients/dni/:dni')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE)
  async getPatientByDni(@Param('dni') dni: string) {
    const patient = await this.patientRepository.findByDni(dni);
    if (!patient) {
      throw new NotFoundException(`No se encontró ningún paciente con DNI ${dni}`);
    }
    return patient;
  }
  
  // 1. Ruta para CREAR el legajo vacío
  // POST /ehr/:patientId
  @Post(':patientId')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN) // Solo Recepcionistas o Admins pueden abrir legajos nuevos
  async createRecord(@Param('patientId') patientId: string) {
    const record = await this.createMedicalRecordUseCase.execute(patientId);
    return { 
      status: 'success',
      message: 'Historia clínica creada exitosamente', 
      data: record 
    };
  }

  // 2. Ruta para AGREGAR una evolución médica
  // POST /ehr/:patientId/progress-notes
  @Roles(UserRole.DOCTOR) // Magia: Solo los Doctores pueden escribir evoluciones
  @Post(':patientId/progress-notes')
  async addProgressNote(
    @Param('patientId') patientId: string,
    @Body('note') note: string,
    @Body('doctorId') doctorId: string, // <-- Lo recibimos directo del JSON
  ) {
    await this.addProgressNoteUseCase.execute({
      patientId,
      doctorId,
      note,
    });

    return { 
      status: 'success',
      message: 'Evolución médica anexada a la historia clínica correctamente' 
    };
  }

  // 3. Ruta para CONSULTAR la historia clínica completa
  // GET /ehr/:patientId
  @Get(':patientId')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN)
  async getMedicalRecord(@Param('patientId') patientId: string) {
    const record = await this.getMedicalRecordUseCase.execute(patientId);
    return {
      status: 'success',
      data: record,
    };
  }
}