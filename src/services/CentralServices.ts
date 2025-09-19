// src/services/CentralServices.ts
import { prisma } from '../config/db';
import { CentralinfoDTO, CentralUpdateDTO } from "../DTOs/CentralDTO";

export class CentralServices {

  async create(data: CentralinfoDTO) {
    console.log("payload Mongo (original):", data);
    //const payload = omit(data, ['ipCentralMRD']); // já filtra o campo

    const {
      ipCentralMRD,  // campo que queremos omitir
      ...payload     // payload agora contém todos os outros campos de data, exceto ipCentralMRD
    } = data;

    // 2) Opcional: se desejar conferir no console o objeto exato que passará ao Prisma:
    console.log("payload Mongo (sem ipCentralMRD):", payload);

    // 3) Agora criamos usando apenas as chaves que existem no modelo Centrais do Prisma
    try {
      const created = await prisma.centrais.create({
        data: {
          device_id: payload.device_id,
          nomeEdificio: payload.nomeEdificio,
          numero: payload.numero,
          rua: payload.rua,
          bairro: payload.bairro,
          ip_local: payload.ip_local,
          ip_VPN: payload.ip_vpn,
          mac: payload.mac,
          version: payload.version,
          status:  'online'//payload.status // Inicialmente online, pode ser atualizado depois

          // NÃO incluímos ipCentralMRD aqui, pois já o removemos
          // createdAt e updatedAt serão gerados automaticamente pelo Prisma
        },
      });
      console.log("payload  create", created);

      return created;
    } catch (err: any) {
      console.error("⛔️ Erro ao criar Centrais no Prisma:", err);
      throw err;
    }
  }
  async findByIP(id: string) {
    return await prisma.centrais.findFirst({
      where: { device_id: id }
    });
  }
  async searchIdCentral(ipCentralMRD: string) {
    const central = await prisma.centrais.findFirst({
      where: {
        ip_VPN: ipCentralMRD,
      },
      select: {
        device_id: true,
      },
    });
    console.log('central: ', central)
    return central;
  }
  async list() {
    return await prisma.centrais.findMany();
  }
  async getById(device_id: string) {
    return await prisma.centrais.findUnique({ where: { device_id } });
  }
  async setOfflineByDeviceId(device_id: string) {
    return prisma.centrais.update({
      where: { device_id },
      data: { status: "offline" },
    });
  }
  async update(data: CentralUpdateDTO) {
    const { device_id, ...rest } = data;
    
    // Remove campos undefined do objeto
    const updateData = Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => value !== undefined)
    );

    // Atualiza o documento no MongoDB usando Prisma
    return await prisma.centrais.update({
      where: { device_id },
      data: updateData,
    });
  }
  async delete(device_id: string) {
    return await prisma.centrais.delete({ where: { device_id } });
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
}
