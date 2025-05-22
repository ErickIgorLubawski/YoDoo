// src/controllers/CentralController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { CentralServices } from "../services/CentralServices";
import { CentralDTO } from "../DTOs/CentralDTO";
import { logExecution } from "../utils/logger";

export class CentralController {

  async create(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip


    const { ipCentralMRD, nomeEdificio, numero, rua, bairro, device_id } = request.body as CentralDTO;
    if (!ipCentralMRD || !nomeEdificio || !numero) {
      return reply.status(400).send({ resp: "Campos obrigatórios: ipCentralMRD, nomeEdificio e numero" });
    }

      try {
        const service = new CentralServices();
        const exists = await service.findByIP(ipCentralMRD);

        if (exists) {
          return reply.status(409).send({ resp: "Já existe uma central com esse IP." });
        }

        const central = await service.create({ ipCentralMRD, nomeEdificio, numero, rua, bairro, device_id });
        await logExecution({ ip: iprequest, class: "CentralController",function: "create",process: "Criação da central",description: "sucess",});;
        return reply.status(200).send({task: "SUCESS.",
          
          resp: central});

      } catch (error: any) {
        await logExecution({ ip: iprequest, class: "CentralController",function: "create",process: "Criação da central",description: "error",});;
      return reply.status(500).send({ resp: "Erro interno do servidor" });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip

    try {
        const service = new CentralServices();
        const centrals = await service.list();
        await logExecution({ ip: iprequest, class: "CentralController",function: "list",process: "lista as centrais",description: "sucess",});;
        return reply.status(200).send({task: "SUCESS.", resp: centrals});
      } catch (error: any) {
        await logExecution({ ip: iprequest, class: "CentralController",function: "list",process: "lista as centrais",description: "error",});;
      return reply.status(500).send({task:  "Erro ao listar centrais."
      });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip

    const { idYD } = request.params as { idYD: string };

      if (!idYD) {
        return reply.status(400).send({rror: "ID é obrigatório"});
      }

      try {
        const service = new CentralServices();
        const central = await service.getById(idYD);

        await logExecution({ ip: iprequest, class: "CentralController",function: "getById",process: "lista central por id",description: "sucess",});;
        return reply.status(200).send({ task: "SUCESS.", resp: central});
      } catch (error: any) {
        await logExecution({ ip: iprequest, class: "CentralController",function: "getById",process: "lista central por id",description: "error",});;
        return reply.status(404).send({ task: "Central não encontrada"});
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    
    const body = request.body as any;
    const id = body._id || body.id;

    const { ipCentralMRD, nomeEdificio, numero, rua, bairro,device_id } = request.body as CentralDTO;

    console.log(request.body);

    if (!id || !ipCentralMRD || !nomeEdificio || !numero) {
      return reply.status(400).send({ error: "Campos obrigatórios: id, ipCentralMRD, nomeEdificio e numero" });
    }

    try {
      const service = new CentralServices();
      const updated = await service.update({ id, ipCentralMRD, nomeEdificio, numero, rua, bairro,device_id });

      await logExecution({ ip: iprequest, class: "CentralController",function: "update",process: "atualiza central",description: "sucess",});;
      return reply.status(200).send({ task: "SUCESS.", resp: updated});
    } catch (error: any) {
      await logExecution({ ip: iprequest, class: "CentralController",function: "update",process: "atualiza central",description: "error",});;
      return reply.status(404).send({ resp: "Central não encontrada"});
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip

    const body = request.body as any;
    const id = body._id || body.id;

    if (!id) {
      return reply.status(400).send({resp: "ID é obrigatório"});
    }
    try {
      const service = new CentralServices();
      const idcentral = await service.getById(id);

      if (!idcentral) {
        return reply.status(404).send({resp: "Central não encontrada"});
      }
      const deleted = await service.delete(id);
      await logExecution({ ip: iprequest, class: "CentralController",function: "delete",process: "deleta central",description: "sucess",});;
      return reply.status(200).send({task: "SUCESS",  data: deleted
      });
      
    } catch (error: any) {
      await logExecution({ ip: iprequest, class: "CentralController",function: "delete",process: "deleta central",description: "error",});;
      return reply.status(400).send({resp:"Erro ao deletar central."});
    }
  }
}

