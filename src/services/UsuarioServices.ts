// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { UsuarioDTO } from "../DTOs/UsuarioDTO";

export class UsuarioServices {
  async createbiometria(data: UsuarioDTO) {
    return await prisma.usuario.create({ data });
  }
/*   async createcustomer(data: CustomerDTO) {
    return await prismaClient.customer.create({ data });
  } */

  async findByIdYD(idYD: string) {
    return await prisma.usuario.findFirst({where: { idYD: idYD }});
  }
  async findByAcesso(acesso: string) {
    return prisma.usuario.findMany({
      where: {
        acessos: {
          has: acesso,
        },
      },
    });
}
  async list() {
    return await prisma.usuario.findMany();
  }

  async getById(idYD: string) {
    return await prisma.usuario.findFirst({ where: { idYD } });
  }

  async update(data: UsuarioDTO) {
    const { name, idYD, password, begin_time, end_time, acessos, bio, base64 } = data;

    return await prisma.usuario.update({
      where: { idYD },
      data: { name, idYD, password, begin_time, end_time, acessos, bio, base64  }
    });
  }

  async delete(idYD: string) {
    return await prisma.usuario.delete({ where: { idYD } });
  }
}
