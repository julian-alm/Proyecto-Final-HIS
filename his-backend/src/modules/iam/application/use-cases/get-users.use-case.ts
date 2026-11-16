import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/ports/user.repository.port'; 

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute() {
    return await this.userRepository.findAll(); 
  }
}