// src/services/EquipmentServices.ts
import { prisma } from '../config/db';
import { EquipamentoDTO,EquipamentoUpdateDTO } from "../DTOs/EquipamentoDTO";

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
  async update(data: EquipamentoUpdateDTO) {
    const { device_id, ...rest } = data;

    // filtra apenas chaves que não sejam undefined
    const updateData = Object.fromEntries(
      Object.entries(rest).filter(([_, v]) => v !== undefined)
    );

    return await prisma.equipamentos.update({
      where: { device_id },
      data: updateData,
    });
  }
  async delete(device_id: string) {
    return await prisma.equipamentos.delete({ where: { device_id } });
  }


  async getIpsAndCentralByDeviceIds(deviceIds: string[]){
    console.log('getIpsAndCentralByDeviceIds', deviceIds);
      return prisma.equipamentos.findMany({
      where: {
        device_id: { in: deviceIds },},
      select: {
        ip: true,
        central_id: true,
      },
    });
  }
  async findByCentralId(central_id: string) {
    try {
      return await prisma.equipamentos.findMany({
        where: { central_id: central_id }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar equipamentos pela central: ${error.message}`);
    }
  }
}
