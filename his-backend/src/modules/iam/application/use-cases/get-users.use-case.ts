import { Injectable, Inject } from '@nestjs/common';
// Ajustá la ruta según dónde tengas definido tu puerto
import { IUserRepository } from '../../domain/ports/user.repository.port'; 

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute() {
    // Asegurate de que tu repositorio tenga un método que devuelva todos los registros
    // Puede llamarse findAll(), getAll() o similar según lo hayan programado
    return await this.userRepository.findAll(); 
  }
}