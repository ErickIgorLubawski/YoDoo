// services/AuthService.ts
import { prisma } from '../config/db';

export class UserService {
  async findUserByLogin(usuario: string) {
    return await prisma.usuarios.findFirst({
      where: { usuario },
    });
  }
}
