// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { CentralDTO } from "../DTOs/CentralDTO";

export class CentralServices {

  
  async create(data: CentralDTO) {
    return await prisma.centrals.create({ data });
  }

  async findByIP(ip: string) {
    return await prisma.centrals.findFirst({
      where: { ipCentralMRD: ip }
    });
  }

  async list() {
    return await prisma.centrals.findMany();
  }

  async getById(id: string) {
    return await prisma.centrals.findUnique({ where: { id } });
  }

  async update(data: CentralDTO) {
    const { id, ipCentralMRD, nomeEdificio, numero, rua, bairro } = data;
    console.log(id)
    return await prisma.centrals.update({
      where: { id },
      data: { ipCentralMRD, nomeEdificio, numero, rua, bairro }
    });
  }

  async delete(id: string) {
    console.log(id,'testemodel')
    return await prisma.centrals.delete({ where: { id } });
  }
}
