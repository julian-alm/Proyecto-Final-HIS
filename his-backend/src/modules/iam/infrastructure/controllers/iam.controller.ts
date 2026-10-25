import { Controller, Post, Get , Body } from '@nestjs/common';
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { UserRole } from '../../domain/entities/user-role.enum';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';

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
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.registerUserUseCase.execute(dto);
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