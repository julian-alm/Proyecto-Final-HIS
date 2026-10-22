import { Injectable, Inject } from '@nestjs/common';
import { IPatientRepository } from '../../domain/interfaces/patient.repository';
import { Patient } from '../../domain/entities/patient.entity';
import { CoverageType } from '../../domain/entities/coverage-type.enum';
import { CreateMedicalRecordUseCase } from './create-medical-record.use-case';
import { v4 as uuidv4 } from 'uuid';

export class RegisterPatientCommand {
    constructor(
        public readonly dni: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly coverageType: CoverageType
    ) {}
}

@Injectable()
export class RegisterPatientUseCase {
    constructor(
        @Inject(IPatientRepository)
        private readonly patientRepository: IPatientRepository,
        private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    ) {}

    async execute(command: RegisterPatientCommand): Promise<Patient> {
        const patientId = uuidv4();

        // 1. Creamos y guardamos los datos filiatorios y la cobertura del paciente
        const newPatient = new Patient(
            patientId,
            command.dni,
            command.firstName,
            command.lastName,
            command.coverageType,
        );
        await this.patientRepository.save(newPatient);

        // 2. ¡Integración automática! Inicializamos su Historia Clínica (HCE) vacía con el mismo ID
        await this.createMedicalRecordUseCase.execute({ patientId } as any);

        return newPatient;
    }
}