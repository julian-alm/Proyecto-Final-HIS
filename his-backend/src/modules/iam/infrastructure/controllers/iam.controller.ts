import { Controller, Post, Get, Body } from '@nestjs/common';
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RegisterPatientUseCase } from '../../application/use-cases/register-patient.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { UserRole } from '../../domain/entities/user-role.enum';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { Roles } from '../guards/roles.guard';

export class RegisterUserDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  passwordPlain: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class RegisterPatientDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  passwordPlain: string;

  @IsNotEmpty()
  dni: string;
}

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  passwordPlain: string;
}

@Controller('iam')
export class IamController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
  ) {}

  @Post('register')
  @Roles(UserRole.ADMIN)
  register(@Body() dto: RegisterUserDto) {
    return this.registerUserUseCase.execute(dto);
  }

  @Post('register/patient')
  registerPatient(@Body() dto: RegisterPatientDto) {
    return this.registerPatientUseCase.execute(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.loginUserUseCase.execute(dto.email, dto.passwordPlain);
  }

  @Get('users')
  getUsers() {
    return this.getUsersUseCase.execute();
  }
}