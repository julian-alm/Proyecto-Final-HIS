import { UserRole } from './user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';

export class User {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public isActive: boolean = true,
  ) {
    this.validateEmail(email);
  }

  private validateEmail(email: string): void {

    if (!email || !email.includes('@')) {
      throw new DomainException('El formato del email del usuario es inválido.');
    }
  }
}