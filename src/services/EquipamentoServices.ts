// src/services/EquipmentServices.ts
import { prisma } from '../config/db';
import { EquipamentoDTO } from "../DTOs/EquipamentoDTO";

export class EquipamentoServices {

  async create(data: EquipamentoDTO) {
    return await prisma.equipamentos.create({ data });
  }

  async findByIdYD(device_id: string) {
    return await prisma.equipamentos.findFirst({
      where: {device_id: device_id },
    });
    
  }

  async list() {
    return await prisma.equipamentos.findMany();
  }

  async getById(id: string) {
    return await prisma.equipamentos.findUnique({ where: { id } });
  }
  async update(data: EquipamentoDTO) {
    const { device_id, ip, device_hostname } = data;
    
    return await prisma.equipamentos.update({
      where: { device_id },
      data: { device_id, ip, device_hostname  }
    });
  }
  

  async delete(device_id: string) {
    return await prisma.equipamentos.delete({ where: { device_id } });
  }
}
