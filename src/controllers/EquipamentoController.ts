// src/controllers/EquipmentController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { EquipamentoServices }    from "../services/EquipamentoServices";
import { EquipamentoDTO }         from "../DTOs/EquipamentoDTO";
import { EquipamentoUpdateDTO }   from "../DTOs/EquipamentoDTO";

export class EquipamentoController {

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { device_id, ip } = request.body as EquipamentoDTO;


    if (device_id == null || !ip) {
      return reply
        .status(400)
        .send({ error: "Campos obrigatórios: device_id e ip" });
    }

    try {
      const service = new EquipamentoServices();


      const exists = await service.findByDeviceId(device_id);
      if (exists) {
        return reply
          .status(409)
          .send({ error: "Equipamento com este device_id já existe." });
      }

      const equipment = await service.create({ device_id, ip });
      return reply
        .status(201)
        .send({ message: "SUCESS.", data: equipment });
    } catch (err: any) {
      return reply
        .status(500)
        .send({ error: err.message || "Erro interno do servidor" });
    }
  }


  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const service = new EquipamentoServices();
      const list = await service.list();
      return reply
        .status(200)
        .send({ message: "SUCESS.", data: list });
    } catch (err: any) {
      return reply
        .status(500)
        .send({ error: err.message || "Erro ao listar equipamentos." });
    }
  }

  // BUSCAR POR ID DO BANCO (_id)
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    if (!id) {
      return reply.status(400).send({ error: "ID é obrigatório" });
    }

    try {
      const service = new EquipamentoServices();
      const equipment = await service.getById(id);
      return reply
        .status(200)
        .send({ message: "Equipamento encontrado.", data: equipment });
    } catch (err: any) {
      return reply
        .status(404)
        .send({ error: err.message || "Equipamento não encontrado." });
    }
  }


  async getByDeviceId(request: FastifyRequest, reply: FastifyReply) {
    const { device_id } = request.params as { device_id: number };
    if (device_id == null) {
      return reply.status(400).send({ error: "device_id é obrigatório" });
    }

    try {
      const service = new EquipamentoServices();
      const equipment = await service.findByDeviceId(device_id);
      return reply
        .status(200)
        .send({ message: "ESUCESS.", data: equipment });
    } catch (err: any) {
      return reply
        .status(404)
        .send({ error: err.message || "Equipamento não encontrado." });
    }
  }

  // UPDATE
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id, device_id, ip } = request.body as EquipamentoUpdateDTO;

    if (!id || device_id == null || !ip) {
      return reply
        .status(400)
        .send({ error: "Campos obrigatórios: id, device_id e ip" });
    }

    try {
      const service = new EquipamentoServices();
      const updated = await service.update({ id, device_id, ip });
      return reply
        .status(200)
        .send({ message: "SUCESS.", data: updated });
    } catch (err: any) {
      return reply
        .status(404)
        .send({ error: err.message || "Equipamento não encontrado." });
    }
  }

  // DELETE
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.body as { id: string };
    if (!id) {
      return reply.status(400).send({ error: "ID é obrigatório" });
    }

    try {
      const service = new EquipamentoServices();
      await service.getById(id); 
      const deleted = await service.delete(id);
      return reply
        .status(200)
        .send({ message: "Equipamento deletado com sucesso.", data: deleted });
    } catch (err: any) {
      return reply
        .status(404)
        .send({ error: err.message || "Erro ao deletar equipamento." });
    }
  }
}
