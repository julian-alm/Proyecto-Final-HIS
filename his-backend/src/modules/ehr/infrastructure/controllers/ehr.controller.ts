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
@UseGuards(RolesGuard)
export class EhrController {
  constructor(
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    private readonly addProgressNoteUseCase: AddProgressNoteUseCase,
    private readonly getMedicalRecordUseCase: GetMedicalRecordUseCase,
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    @Inject(IPatientRepository)
    private readonly patientRepository: IPatientRepository,
  ) {}

  @Post('patients')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async registerPatient(@Body() body: RegisterPatientDto) {
    const patientId = await this.registerPatientUseCase.execute(
      new RegisterPatientCommand(body.dni, body.firstName, body.lastName, body.coverageType as CoverageType)
    );
    return { message: 'Paciente registrado exitosamente', patientId };
  }

  @Get('patients/dni/:dni')
  // 👇 ACÁ ESTÁ EL CAMBIO: Agregado UserRole.PATIENT para que NestJS no bloquee la consulta
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  async getPatientByDni(@Param('dni') dni: string) {
    const patient = await this.patientRepository.findByDni(dni);
    if (!patient) {
      throw new NotFoundException(`No se encontró ningún paciente con DNI ${dni}`);
    }
    return patient;
  }
  
  @Post(':patientId')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR) 
  async createRecord(@Param('patientId') patientId: string) {
    const record = await this.createMedicalRecordUseCase.execute(patientId);
    return { 
      status: 'success',
      message: 'Historia clínica creada exitosamente', 
      data: record 
    };
  }

  @Roles(UserRole.DOCTOR)
  @Post(':patientId/progress-notes')
  async addProgressNote(
    @Param('patientId') patientId: string,
    @Body('note') note: string,
    @Body('doctorId') doctorId: string, 
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

  @Get(':patientId')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.PATIENT)
  async getMedicalRecord(@Param('patientId') patientId: string) {
    const record = await this.getMedicalRecordUseCase.execute(patientId);
    return {
      status: 'success',
      data: record,
    };
  }
}