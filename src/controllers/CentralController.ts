// src/controllers/CentralController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { CentralServices } from "../services/CentralServices";
import { CentralDTO } from "../DTOs/CentralDTO";
import { CentralUpdateDTO } from "../DTOs/CentralDTO";

export class CentralController {

  async create(request: FastifyRequest, reply: FastifyReply) {


    const { ipCentralMRD, nomeEdificio, numero, rua, bairro } = request.body as CentralDTO;
    if (!ipCentralMRD || !nomeEdificio || !numero) {
      return reply.status(400).send({ error: "Campos obrigatórios: ipCentralMRD, nomeEdificio e numero" });
    }

      try {
        const service = new CentralServices();
        const exists = await service.findByIP(ipCentralMRD);

        if (exists) {
          return reply.status(409).send({ error: "Já existe uma central com esse IP." });
        }

        const central = await service.create({ ipCentralMRD, nomeEdificio, numero, rua, bairro });
        return reply.status(200).send({message: "SUCESS.",data: central});

      } catch (error: any) {
      return reply.status(500).send({ error: error.message || "Erro interno do servidor" });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {

    try {
        const service = new CentralServices();
        const centrals = await service.list();

        return reply.status(200).send({message: "SUCESS.", data: centrals});

      } catch (error: any) {
      return reply.status(500).send({error: error.message || "Erro ao listar centrais."
      });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {

    const { id } = request.params as { id: string };

      if (!id) {
        return reply.status(400).send({rror: "ID é obrigatório"});
      }

      try {
        const service = new CentralServices();
        const central = await service.getById(id);

        return reply.status(200).send({ message: "CSUCESS.", data: central});

      } catch (error: any) {
        return reply.status(404).send({ error: error.message || "Central não encontrada"});
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id, ipCentralMRD, nomeEdificio, numero, rua, bairro } = request.body as CentralUpdateDTO;

    if (!id || !ipCentralMRD || !nomeEdificio || !numero) {
      return reply.status(400).send({ error: "Campos obrigatórios: id, ipCentralMRD, nomeEdificio e numero" });
    }

    try {
      const service = new CentralServices();
      const updated = await service.update({ id, ipCentralMRD, nomeEdificio, numero, rua, bairro });

      return reply.status(200).send({ message: "SUCESS.", data: updated});

    } catch (error: any) {
      return reply.status(404).send({ error: error.message || "Central não encontrada"});
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.body as { id: string };

    if (!id) {
      return reply.status(400).send({error: "ID é obrigatório"});
    }

    try {
      const service = new CentralServices();
      const idcentral = await service.findByIP(id);
        if (!idcentral) {
          return reply.status(404).send({error: "Central não encontrada"});
        }
      const deleted = await service.delete(id);

      return reply.status(200).send({message: "Central deletada com sucesso.",  data: deleted
      });
      
    } catch (error: any) {
      return reply.status(400).send({error: error.message || "Erro ao deletar central."});
    }
  }
}
