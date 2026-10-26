import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from '../../../../modules/iam/infrastructure/persistence/user.orm-entity';

@Entity('doctor_profiles')
export class DoctorProfileOrmEntity {
    @PrimaryColumn('uuid')
    id: string; 

    @Column({ type: 'uuid', unique: true })
    userId: string; 

    @Column({ unique: true })
    licenseNumber: string; 

    @Column()
    specialty: string; 

    // La magia del JOIN: TypeORM usará el 'userId' para buscar en la tabla 'users'
    @OneToOne(() => UserOrmEntity)
    @JoinColumn({ name: 'userId' }) 
    user: UserOrmEntity;
}