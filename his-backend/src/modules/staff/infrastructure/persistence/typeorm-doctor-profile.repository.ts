import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfileOrmEntity } from './doctor-profile.orm-entity';
import { DoctorPatientAssignmentOrmEntity } from './doctor-patient-assignment.orm-entity';

@Injectable()
export class TypeOrmDoctorProfileRepository {
    constructor(
        @InjectRepository(DoctorProfileOrmEntity)
        private readonly doctorRepository: Repository<DoctorProfileOrmEntity>,
        
        // Inyectamos la nueva tabla puente
        @InjectRepository(DoctorPatientAssignmentOrmEntity)
        private readonly assignmentRepository: Repository<DoctorPatientAssignmentOrmEntity>,
    ) {}

    async findAllDoctors(): Promise<DoctorProfileOrmEntity[]> {
        return this.doctorRepository.find({
            relations: { user: true }, 
            order: {
                user: { fullName: 'ASC' }
            }
        });
    }

    // Nueva función: Guarda la relación Médico - Paciente
    async assignPatientToDoctor(doctorId: string, patientId: string): Promise<DoctorPatientAssignmentOrmEntity> {
        const assignment = this.assignmentRepository.create({
            doctorId,
            patientId
        });
        return this.assignmentRepository.save(assignment);
    }

    // Nueva función: Busca todos los pacientes asignados a un médico
    async getAssignedPatients(doctorId: string): Promise<string[]> {
        const assignments = await this.assignmentRepository.find({
            where: { doctorId },
            order: { assignedAt: 'DESC' }
        });
        // Devolvemos solo un array con los IDs de los pacientes
        return assignments.map(a => a.patientId);
    }
    // Nueva función: Crear el perfil médico automáticamente
    async createProfile(userId: string, licenseNumber: string, specialty: string): Promise<DoctorProfileOrmEntity> {
        const newProfile = this.doctorRepository.create({
            userId,
            licenseNumber,
            specialty
        });
        return this.doctorRepository.save(newProfile);
    }
}