// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { CentralDTO } from "../DTOs/CentralDTO";

export class CentralServices {

  
  async create(data: CentralDTO) {
    return await prisma.centrais.create({ data });
  }

  async findByIP(ip: string) {
    return await prisma.centrais.findFirst({
      where: { ipCentralMRD: ip }
    });
  }

  async list() {
    return await prisma.centrais.findMany();
  }

  async getById(id: string) {
    return await prisma.centrais.findUnique({ where: { id } });
  }

  async getByDeviceIds(deviceIds: string[]) {
    return await prisma.centrais.findMany({
      where: {
        device_id: {
          in: deviceIds
        }
      }
    });
  }

  async update(data: CentralDTO) {
    const { id, ipCentralMRD, nomeEdificio, numero, rua, bairro } = data;
    console.log(id)
    return await prisma.centrais.update({
      where: { id },
      data: { ipCentralMRD, nomeEdificio, numero, rua, bairro }
    });
  }

  async delete(id: string) {
    console.log(id)
    return await prisma.centrais.delete({ where: { id } });
  }
}
