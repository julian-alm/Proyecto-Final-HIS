import { Entity, PrimaryColumn, Column, VersionColumn } from 'typeorm';

@Entity('beds')
export class BedOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ unique: true })
    roomNumber: string;

    @Column({ nullable: true })
    patientId: string;

    @Column()
    status: string;

    @VersionColumn()
    version: number;
}