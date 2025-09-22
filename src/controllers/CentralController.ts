// src/controllers/CentralController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { CentralServices } from "../services/CentralServices";
import { CentralDTO, CentralinfoDTO, CentralUpdateDTO, CentralWithStatusDTO } from "../DTOs/CentralDTO";
import { logExecution } from "../utils/logger";
import { RequestEquipamento } from "./RequestEquipamento";

export class CentralController {

  async create(request: FastifyRequest, reply: FastifyReply) {

    const iprequest = request.ip
    const central = request.body as CentralDTO;
    if (!central.ipCentralMRD || !central.nomeEdificio || !central.device_id || !central.numero || !central.rua || !central.bairro) {
      return reply.status(400).send({ resp: "Campos obrigatórios: ipCentralMRD, nomeEdificio e numero" });
    }

    try {


      const service = new CentralServices();
      const exists = await service.findByIP(central.device_id);
      console.log("exists", exists)
      if (exists) {
        return reply.status(409).send({ resp: "Já existe uma central com esse com esse id." });
      }

      const ipcentralmrd = central.ipCentralMRD.replace("http://", "").replace("https://", "")

      const requestequipamento = new RequestEquipamento()
      const infocentral = await requestequipamento.searchInfoCentral(ipcentralmrd)
      console.log(infocentral)
      const completeCenter: CentralinfoDTO = {
        // tudo que veio do front
        device_id: central.device_id,
        ipCentralMRD: central.ipCentralMRD,
        nomeEdificio: central.nomeEdificio,
        numero: central.numero,
        rua: central.rua,
        bairro: central.bairro,
        //dados central
        version: infocentral.resp.version,
        ip_local: infocentral.resp.ip_local,
        ip_vpn: infocentral.resp.ip_vpn, //'189.101.65.76:557'
        mac: infocentral.resp.mac,
        status: 'online', // Inicialmente offline, será atualizado posteriormente
      };
      const responseDbCentral = await service.create(completeCenter);
      await logExecution({ ip: iprequest, class: "CentralController", function: "create", process: "Criação da central", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: responseDbCentral });
    } catch (error: any) {
      await logExecution({ ip: iprequest, class: "CentralController", function: "create", process: "Criação da central", description: "error", });;
      return reply.status(500).send({ resp: "Erro interno do servidor" });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {

    const iprequest = request.ip
    const { device_id } = request.query as { device_id: string };

    try {
      if (!device_id) {
        const service = new CentralServices();
        const centrals = await service.list();
        
        // Aplicar Mapeia cada central para obter o status

        // const statusRequester = new RequestEquipamento();
        // const centralsWithStatus: CentralWithStatusDTO[] = await Promise.all(
        //   centrals.map(async (central: any) => {
        //     const ip = central.ip_VPN;
        //     const status = await statusRequester.Status(ip);
        //     //console.log()
        //     return {
        //       ...central,
        //       status
        //     };
        //   })
        // );

        await logExecution({ ip: iprequest, class: "CentralController", function: "list", process: "lista todas as centrais", description: "sucess", });;
        return reply.status(200).send({ task: "SUCESS.", resp: centrals });
      }

      const service = new CentralServices();
      const central = await service.getById(device_id);

      await logExecution({ ip: iprequest, class: "CentralController", function: "getById", process: "lista central por id", description: "sucess", });;
        return reply.status(200).send({ task: "SUCESS.", resp: central });
    } catch (error: any) {
      await logExecution({ ip: iprequest, class: "CentralController", function: "getById", process: "lista central por id", description: "error", });;
        return reply.status(404).send({ task: "Central não encontrada" });
    }
  }


  async update(request: FastifyRequest, reply: FastifyReply) {

    const iprequest = request.ip
    const central = request.body as CentralUpdateDTO;

    if (!central.device_id) {
      return reply.status(400).send({ error: "Campos obrigatórios: id, ipCentralMRD, nomeEdificio e numero" });
    }

    try {
      central.device_id = String(central.device_id);
      const service = new CentralServices();
      const responseDbCentral = await service.update(central);

      await logExecution({ ip: iprequest, class: "CentralController", function: "update", process: "atualiza central", description: "sucess", });;

      return reply.status(200).send({ task: "SUCESS.", resp: responseDbCentral });
    } catch (error: any) {
      await logExecution({ ip: iprequest, class: "CentralController", function: "update", process: "atualiza central", description: "error", });;
      return reply.status(404).send({ resp: "Central não encontrada" });
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    const Central = request.body as CentralDTO;
    if (!Central.device_id) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }
    try {
      const service = new CentralServices();
      const idcentral = await service.getById(Central.device_id);
      if (!idcentral) {
        return reply.status(404).send({ resp: "Central não encontrada" });
      }
      const deleted = await service.delete(Central.device_id)
      await logExecution({ ip: iprequest, class: "CentralController", function: "delete", process: "deleta central", description: "sucess", });;
        return reply.status(200).send({task: "SUCESS", data: deleted});
    } catch (error: any) {
      await logExecution({ ip: iprequest, class: "CentralController", function: "delete", process: "deleta central", description: "error", });;
        return reply.status(400).send({ resp: "Erro ao deletar central." });
    }
  }
}

