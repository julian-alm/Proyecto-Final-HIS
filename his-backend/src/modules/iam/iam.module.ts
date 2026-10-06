import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { IUserRepository } from './domain/ports/user.repository.port';
import { PostgresUserRepository } from './infrastructure/persistence/postgres-user.repository';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { IamController } from './infrastructure/controllers/iam.controller';
import { RolesGuard } from './infrastructure/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'clave_secreta_hospital_2026',
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [IamController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    RolesGuard,
    {
      provide: IUserRepository,
      useClass: PostgresUserRepository,
    },
  ],
  exports: [RolesGuard, JwtModule],
})
export class IamModule {}