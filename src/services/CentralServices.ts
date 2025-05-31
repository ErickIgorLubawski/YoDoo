// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { CentralDTO } from "../DTOs/CentralDTO";

export class CentralServices {

  async create(data: CentralDTO) {
    return await prisma.centrais.create({ data });
  }
  async findByIP(id: string) {
    return await prisma.centrais.findFirst({
      where: { device_id: id }
    });
  }
  async list() {
    return await prisma.centrais.findMany();
  }
  async getById(device_id: string) {
    return await prisma.centrais.findUnique({ where: { device_id } });
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
    const { device_id ,ipCentralMRD, nomeEdificio, numero, rua, bairro } = data;
    return await prisma.centrais.update({
      where: { device_id },
      data: { ipCentralMRD, nomeEdificio, numero, rua, bairro }
    });
  }
  async delete(device_id: string) {
    return await prisma.centrais.delete({ where: { device_id } });
  }
}
