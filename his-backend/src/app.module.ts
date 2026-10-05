import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdmissionModule } from './modules/admission/admission.module';
import { NursingCareModule } from './modules/nursing-care/nursing-care.module';
import { EhrModule } from './modules/ehr/ehr.module';
import { IamModule } from './modules/iam/iam.module';

@Module({
    imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'his_db',
        autoLoadEntities: true, // Carga las tablas de infrastructure/persistence automáticamente
        synchronize: true,      // En desarrollo crea/actualiza las tablas solas al guardar
    }),
    IamModule,
    AdmissionModule,
    EhrModule,
    NursingCareModule,
    ],
})
export class AppModule {}