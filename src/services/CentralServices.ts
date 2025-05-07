// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { CentralDTO } from "../DTOs/CentralDTO";
import { CentralUpdateDTO } from "../DTOs/CentralDTO";

export class CentralServices {

  
  async create(data: CentralDTO) {
    return await prisma.central.create({ data });
  }

  async findByIP(ip: string) {
    return await prisma.central.findFirst({
      where: { ipCentralMRD: ip }
    });
  }

  async list() {
    return await prisma.central.findMany();
  }

  async getById(id: string) {
    return await prisma.central.findUnique({ where: { id } });
  }

  async update(data: CentralUpdateDTO) {
    const { id, ipCentralMRD, nomeEdificio, numero, rua, bairro } = data;

    return await prisma.central.update({
      where: { id },
      data: { ipCentralMRD, nomeEdificio, numero, rua, bairro }
    });
  }

  async delete(id: string) {
    return await prisma.central.delete({ where: { id } });
  }
}
