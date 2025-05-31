// src/controllers/EquipmentController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { EquipamentoServices } from "../services/EquipamentoServices";
import { EquipamentoDTO } from "../DTOs/EquipamentoDTO";
import { logExecution } from "../utils/logger";
import { RequestEquipamento } from "../controllers/RequestEquipamento"
import { CentralServices } from "../services/CentralServices";

export class EquipamentoController {


  async create(request: FastifyRequest, reply: FastifyReply) {

    const iprequest = request.ip
    const ipcentralmrd = request.headers['ipcentralmrd'];
    console.log(ipcentralmrd)
    if (!ipcentralmrd) {
      return reply.status(400).send({ task: "ERROR.", resp: 'Preencher IPcentral' });
    }
    try {
      
      //Equipamemtos da central
      const requestequipamento = new RequestEquipamento()
      const equipamentoscentral = await requestequipamento.searchEquipamentoCentral(ipcentralmrd)
      const listaEquipamentoscentral = equipamentoscentral?.resp?.ListadeEqs ?? [];
      console.log('equipamentos central: ', listaEquipamentoscentral)

      //idcentral
      const servicecentral = new CentralServices();
      const id = await servicecentral.searchIdCentral(ipcentralmrd);
      const central_id = id?.device_id.toString() // convertendo aqui

      //Equipamentos do banco
      const serviceequipamento = new EquipamentoServices();
      const equipamentosdb = await serviceequipamento.list();
      console.log('equipamentos banco: ', equipamentosdb)

      const idsBanco = new Set(equipamentosdb.map(e => e.device_id));
      // Filtrar apenas os equipamentos da central que NÃO estão no banco
    // Filtrar apenas os equipamentos da central que NÃO estão no banco
    const novosEquipamentos = listaEquipamentoscentral.filter((eq: { device_id: string }) =>
      !idsBanco.has(eq.device_id)
    );


    if (novosEquipamentos.length === 0) {
      // Nenhum novo equipamento, retorna os da central
      await logExecution({ip: iprequest,class: "EquipamentoController",function: "create",process: "nenhum novo equipamento",description: "nenhum novo para cadastrar", });
      return reply.status(200).send({ task: "SUCESS.",resp: listaEquipamentoscentral,message: "Nenhum novo equipamento cadastrado. Apenas retorno da central.",});
    }

      console.log('novos para cadastrar:', novosEquipamentos);
      // Mapear os dados corretamente e salvar um a um
      for (const equip of novosEquipamentos) {
        await serviceequipamento.create({
          device_id: equip.device_id,
          ip: equip.ip,
          mac: equip.mac,
          central_id: central_id ?? '',
          device_hostname: equip.name,
        });
      }
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "list", process: "list equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: equipamentoscentral });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "create", process: "cria equipamento", description: "error", });;
      return reply.status(500).send({ resp: "ERROR" });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    try {
      const service = new EquipamentoServices();
      const list = await service.list();
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "list", process: "list equipamento", description: "sucess", });;

      return reply.status(200).send({ task: "SUCESS.", resp: list });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "list", process: "list equipamento", description: "sucess", });;
      return reply.status(500).send({ resp: "Erro ao listar equipamentos." });
    }
  }
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    const { id } = request.params as { id: string };
    if (!id) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }

    try {
      const service = new EquipamentoServices();
      const equipmento = await service.getById(id);
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "getById", process: "lista equipamento por id ", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: equipmento });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "getById", process: "lista equipamento por id ", description: "error", });;
      return reply.status(404).send({ resp: err.message });
    }
  }
  async getByDeviceId(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    const { device_id } = request.params as EquipamentoDTO;

    if (!device_id) {
      return reply.status(400).send({ error: "device_id é obrigatório" });
    }
    try {
      const service = new EquipamentoServices();
      const equipmento = await service.findByIdYD(device_id);

      if (!equipmento) {
        return reply.status(404).send({ resp: "Equipamento não encontrado." });
      }
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "getByDeviceId", process: "lista equipamento por id ", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: equipmento });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "getByDeviceId", process: "lista equipamento por id ", description: "error", });;
      return reply.status(404).send({ resp: err.message || "Equipamento não encontrado." });
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    const { device_id, ip, mac, central_id } = request.body as EquipamentoDTO;

    if (!device_id || !ip) {
      return reply.status(400).send({ resp: "Campos obrigatórios: id, device_id e ip" });
    }
    try {
      const service = new EquipamentoServices();
      const updated = await service.update({ device_id, ip, mac, central_id });

      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "update", process: "atualiza equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: updated });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "update", process: "atualiza equipamento", description: "error", });;
      return reply.status(404).send({ resp: "Equipamento não encontrado." });
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    const { device_id } = request.body as { device_id: string };

    if (!device_id) {
      return reply.status(400).send({ resp: "ID é obrigatório e IP obrigatorio" });
    }

    try {
      const service = new EquipamentoServices();
      const equipamentoid = await service.findByIdYD(device_id);
      if (!equipamentoid) {
        return reply.status(404).send({ resp: "Equipamento não encontrada" });
      }
      const deleted = await service.delete(device_id);

      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "delete", process: "deleta equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: deleted });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "delete", process: "deleta equipamento", description: "error", });;
      return reply.status(404).send({ resp: "Erro ao deletar equipamento." });
    }
  }
}
