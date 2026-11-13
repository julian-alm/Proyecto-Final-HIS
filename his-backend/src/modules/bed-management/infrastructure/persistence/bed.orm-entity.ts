import { Entity, PrimaryColumn, Column, VersionColumn } from 'typeorm';

@Entity('beds')
export class BedOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    // Índice único: Impide que dos usuarios creen la "Cama 101" en la base de datos
    @Column({ unique: true })
    roomNumber: string;

    @Column({ nullable: true })
    patientId: string;

    @Column()
    status: string;

    // Bloqueo Optimista: Evita que dos administrativos asignen la cama al mismo tiempo
    @VersionColumn()
    version: number;
}