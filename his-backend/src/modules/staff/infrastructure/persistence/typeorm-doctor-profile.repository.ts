import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfileOrmEntity } from './doctor-profile.orm-entity';

@Injectable()
export class TypeOrmDoctorProfileRepository {
    constructor(
        @InjectRepository(DoctorProfileOrmEntity)
        private readonly ormRepository: Repository<DoctorProfileOrmEntity>,
    ) {}

    async findAllDoctors(): Promise<DoctorProfileOrmEntity[]> {
        return this.ormRepository.find({
            relations: { user: true }, // Le decimos a TypeORM que haga el JOIN
            order: {
                user: {
                    fullName: 'ASC' // Ordenamos alfabéticamente usando el nombre de la tabla anidada
                }
            }
        });
    }
}