// src/services/EquipmentServices.ts
import { prisma } from '../config/db';
import { EquipamentoDTO, EquipamentoUpdateDTO } from "../DTOs/EquipamentoDTO";

export class EquipamentoServices {
  async create(data: EquipamentoDTO) {
    return await prisma.equipamentos.create({ data });
  }

  async findByDeviceId(device_id: number) {
    return await prisma.equipamentos.findFirst({
      where: { device_id }
    });
  }

  async list() {
    return await prisma.equipamentos.findMany();
  }

  async getById(id: string) {
    if (!id) throw new Error("ID é obrigatório");
    const eq = await prisma.equipamentos.findUnique({ where: { id } });
    if (!eq) throw new Error("Equipamento não encontrado");
    return eq;
  }

  async update(data: EquipamentoUpdateDTO) {
    const { id, device_id, ip } = data;
    if (!id) throw new Error("ID é obrigatório");
    await this.getById(id); // valida existência
    return prisma.equipamentos.update({
      where: { id },
      data: { device_id, ip }
    });
  }

  async delete(id: string) {
    if (!id) throw new Error("ID é obrigatório");
    return await prisma.equipamentos.delete({ where: { id } });
  }
}
