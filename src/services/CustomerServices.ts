// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { CustomerUpdateDTO } from "../DTOs/CustomerDTO";
import { CustomerBiometriaDTO } from "../DTOs/CustomerDTO";

export class CustomerServices {
  async createbiometria(data: CustomerBiometriaDTO) {
    return await prisma.customer.create({ data });
  }
/*   async createcustomer(data: CustomerDTO) {
    return await prismaClient.customer.create({ data });
  } */

  async findByIdYD(idYD: string) {
    return await prisma.customer.findFirst({
      where: { idYD: idYD }
    });
  }

  async list() {
    return await prisma.customer.findMany();
  }

  async getById(idYD: string) {
    return await prisma.customer.findFirst({ where: { idYD } });
  }

  async update(data: CustomerUpdateDTO) {
    const { id, name, idYD, password, begin_time, end_time, acessos, bio, base64 } = data;

    return await prisma.customer.update({
      where: { id },
      data: { name, idYD, password, begin_time, end_time, acessos, bio, base64  }
    });
  }

  async delete(id: string) {
    return await prisma.customer.delete({ where: { id } });
  }
}
