// src/controllers/EquipmentController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { EquipamentoServices }    from "../services/EquipamentoServices";
import { EquipamentoDTO }         from "../DTOs/EquipamentoDTO";

export class EquipamentoController {

  
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { device_id, ip, device_hostname } = request.body as EquipamentoDTO;

    if (!device_id || !ip) {
      return reply .status(400).send({ resp: "Campos obrigatórios: device_id e ip" });
    }
    console.log(request.body);
    try {
      
      const service = new EquipamentoServices();
      const exists = await service.findByIdYD( device_id);
      
      if (exists) {
        return reply.status(409).send({ resp: "Equipamento com este device_id já existe." });
      }

      const equipmento = await service.create({ device_id, ip, device_hostname });
      return reply.status(201).send({ task: "SUCESS.", resp: equipmento });

    } catch (err: any) {
      return reply.status(500).send({ resp: err.message || "ERROR" });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
        const service = new EquipamentoServices();
        const list = await service.list();
        return reply.status(200).send({ task: "SUCESS.", data: list });
      } catch (err: any) {
      return reply.status(500).send({ resp: err.message || "Erro ao listar equipamentos." });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {

    const { id } = request.params as { id: string };
    if (!id) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }

    try {
      const service = new EquipamentoServices();
      const equipmento = await service.getById(id);
      return reply.status(200).send({ task: "SUCESS.", resp: equipmento });
    } catch (err: any) {
      return reply.status(404).send({ resp: err.message});
    }
  }
  async getByDeviceId(request: FastifyRequest, reply: FastifyReply) {
    
    const { device_id } = request.params as EquipamentoDTO;
    
    if (!device_id ) {
      return reply.status(400).send({ error: "device_id é obrigatório" });
    }

    try {
      const service = new EquipamentoServices();
      const equipmento = await service.findByIdYD(device_id );

      if(!equipmento) {
        return reply.status(404).send({ resp: "Equipamento não encontrado." });
      }
      return reply.status(200).send({ task: "SUCESS.", resp: equipmento });
    } catch (err: any) {
      return reply.status(404).send({ resp: err.message || "Equipamento não encontrado." });
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    
    const { device_id, ip } = request.body as EquipamentoDTO;

    if ( !device_id|| !ip) {
      return reply.status(400).send({ resp: "Campos obrigatórios: id, device_id e ip" });
    }
    try {
      const service = new EquipamentoServices();
      const updated = await service.update({  device_id, ip });

      return reply.status(200).send({ task: "SUCESS.", resp: updated });

    } catch (err: any) {
      return reply.status(404).send({ resp: "Equipamento não encontrado." });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    
    const { device_id } = request.body as { device_id: string };
    
    if (!device_id) {
      return reply.status(400).send({ resp: "ID é obrigatório e IP obrigatorio" });
    }

    try {
      const service = new EquipamentoServices();
      const equipamentoid = await service.findByIdYD(device_id); 
      console.log(equipamentoid);
      if (!equipamentoid) {
        return reply.status(404).send({resp: "Equipamento não encontrada"});
      }
      const deleted = await service.delete(device_id);
      
      return reply.status(200).send({ task: "SUCESS", resp: deleted });
    } catch (err: any) {
      return reply.status(404).send({ resp:"Erro ao deletar equipamento." });
    }
  }
}
