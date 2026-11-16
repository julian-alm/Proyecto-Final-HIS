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

  async assignPatientToDoctor(doctorId: string, patientId: string): Promise<DoctorPatientAssignmentOrmEntity> {
    const assignment = this.assignmentRepository.create({
      doctorId,
      patientId
    });
    return this.assignmentRepository.save(assignment);
  }

  async getAssignedPatients(doctorId: string): Promise<string[]> {
    const assignments = await this.assignmentRepository.find({
      where: { doctorId },
      order: { assignedAt: 'DESC' }
    });
    return assignments.map(a => a.patientId);
  }

  async createProfile(userId: string, licenseNumber: string, specialty: string): Promise<DoctorProfileOrmEntity> {
    const newProfile = this.doctorRepository.create({
      userId,
      licenseNumber,
      specialty
    });
    return this.doctorRepository.save(newProfile);
  }

  async saveProfile(profileData: Partial<DoctorProfileOrmEntity>): Promise<DoctorProfileOrmEntity> {
    const newProfile = this.doctorRepository.create(profileData);
    return await this.doctorRepository.save(newProfile);
  }

  async findByUserId(userId: string): Promise<DoctorProfileOrmEntity | null> {
    return this.doctorRepository.findOne({ 
      where: { userId } 
    });
  }
}