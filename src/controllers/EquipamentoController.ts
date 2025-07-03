// src/controllers/EquipmentController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { EquipamentoServices } from "../services/EquipamentoServices";
import { EquipamentoDTO, EquipamentoUpdateDTO,EquipamentoWithStatusDTO  } from "../DTOs/EquipamentoDTO";
import { logExecution } from "../utils/logger";
import { RequestEquipamento } from "../controllers/RequestEquipamento"
import { CentralServices } from "../services/CentralServices";

export class EquipamentoController {

  async create(request: FastifyRequest, reply: FastifyReply) {

    const iprequest = request.ip
    const { ipcentralmrd } = request.query as { ipcentralmrd: string };

    if (!ipcentralmrd) {
      return reply.status(400).send({ task: "ERROR.", resp: 'Preencher ipcentralmrd: Params' });
    }
    try {

      //Equipamemtos da central
      const requestequipamento = new RequestEquipamento()
      const equipamentoscentral = await requestequipamento.searchInfoEquipamento(ipcentralmrd)
      const listaEquipamentoscentral = equipamentoscentral?.resp?.ListadeEqs ?? [];
      console.log('equipamentos central: ', listaEquipamentoscentral)

      //idcentral
      const servicecentral = new CentralServices();
      const id = await servicecentral.searchIdCentral(ipcentralmrd);
      const central_id = id?.device_id.toString()
      console.log('central_id:', id)
      console.log('central_id:', central_id)

    
      //Equipamentos do banco
      const serviceequipamento = new EquipamentoServices();
      const equipamentosdb = await serviceequipamento.list();
      console.log('equipamentos banco: ', equipamentosdb)

      const idsBanco = new Set(equipamentosdb.map(e => e.device_id));
      // Filtrar apenas os equipamentos da central que NÃO estão no banco
      const novosEquipamentos = listaEquipamentoscentral.filter((eq: { device_id: string }) =>
        !idsBanco.has(eq.device_id)
      );
      if (novosEquipamentos.length === 0) {
        // Nenhum novo equipamento, retorna os da central
        await logExecution({ ip: iprequest, class: "EquipamentoController", function: "create", process: "nenhum novo equipamento", description: "nenhum novo para cadastrar", });
        return reply.status(200).send({ task: "SUCESS.", resp: listaEquipamentoscentral, message: "Nenhum novo equipamento cadastrado. Apenas retorno da central.", });
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
          status: 'online'
        });
      }
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "list", process: "list equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: 'novos equipamentos criado no banco',novosEquipamentos });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "create", process: "cria equipamento", description: "error", });;
      return reply.status(500).send({ resp: "ERROR" });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {
    
    const iprequest = request.ip
    const { central_id } = request.query as { central_id?: string }
    console.log(central_id)
    try {
      const equipamentoService = new EquipamentoServices();
      console.log('--- EXECUTANDO VERSÃO CORRIGIDA DE 26/06 ---');
      if (central_id) {
        const equipamentosnacentral = await equipamentoService.findByCentralId(central_id);
        console.log(equipamentosnacentral)
        return reply.status(200).send({ task: "SUCESS.", resp: equipamentosnacentral });
      }
      const service = new EquipamentoServices();
      const list = await service.list();
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "list", process: "list equipamento", description: "sucess", });;

      return reply.status(200).send({ task: "SUCESS.", resp: list });
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "list", process: "list equipamento", description: "sucess", });;
      return reply.status(500).send({ resp: "Erro ao listar equipamentos." });
    }
  }
  // async getById(request: FastifyRequest, reply: FastifyReply) {
  //   const iprequest = request.ip
  //   const { id } = request.params as { id: string };
  //   if (!id) {
  //     return reply.status(400).send({ resp: "ID é obrigatório" });
  //   }

  //   try {
  //     const service = new EquipamentoServices();
  //     const equipmento = await service.getById(id);
  //     await logExecution({ ip: iprequest, class: "EquipamentoController", function: "getById", process: "lista equipamento por id ", description: "sucess", });;
  //     return reply.status(200).send({ task: "SUCESS.", resp: equipmento });
  //   } catch (err: any) {
  //     await logExecution({ ip: iprequest, class: "EquipamentoController", function: "getById", process: "lista equipamento por id ", description: "error", });;
  //     return reply.status(404).send({ resp: err.message });
  //   }
  // }
  async listEquipamentos(request: FastifyRequest, reply: FastifyReply) {
    const ipRequest = request.ip;
    const { device_id } = request.query as { device_id?: string };

    const equipamentoService = new EquipamentoServices();
    const statusRequester = new RequestEquipamento();

    // 1) Se recebeu device_id, mantém fluxo antigo
    if (device_id) {
      try {
        const equipamento = await equipamentoService.findByIdYD(device_id);
        if (!equipamento) {
          return reply.status(404).send({ resp: 'Equipamento não encontrado.' });
        }

        await logExecution({ip: ipRequest,class: 'EquipamentoController',function: 'getByDeviceId', process: 'lista equipamento por id',description: 'sucess'});
        return reply.status(200).send({ task: 'SUCESS.', resp: equipamento });

      } catch (err: any) {
        await logExecution({ ip: ipRequest,class: 'EquipamentoController', function: 'getByDeviceId',process: 'lista equipamento por id',description: 'error'
        });
        return reply.status(404).send({ resp: err.message || 'Equipamento não encontrado.' });
      }
    }

    // 2) Sem device_id → busca todos + status
    try {
      // 2.1) Buscar todos equipamentos no DB
      const equipamentos = await equipamentoService.list();

      // 2.2) extrair IDs únicos de central
      const centralIds = Array.from(new Set(equipamentos.map(e => e.central_id)));
      
      // 2.3) batch fetch das centrais
      const centralService = new CentralServices();
      const centrals = await Promise.all(
        centralIds.map(id => centralService.getById(id))
      );

      console.log('2.3 - Centrals fetched:', centrals);
      // 2.4) montar map de central_id → ip_completo
      const centralMap: Record<string, string> = {};
      const validCentrals = centrals.filter(
        (c): c is { id: string; device_id: string; mac: string; createdAt: Date; updatedAt: Date; ip_local: string; ip_VPN: string | null; nomeEdificio: string; numero: string; rua: string; bairro: string; version: string; status: 'online'} =>
          c != null
      );
      console.log('2.4 - Central map:', validCentrals);
      
      validCentrals.forEach(c => {
        const rawIp = c.ip_VPN ?? c.ip_local;
        centralMap[c.device_id] = rawIp;
      });

      // 2.5) paralelizar status
      const equipamentosWithStatus: EquipamentoWithStatusDTO[] =
        await Promise.all(
          equipamentos.map(async eq => {
            const ipCentral = centralMap[eq.central_id] || '';
            const status = await statusRequester.StatusEquipamento(ipCentral,eq.ip);
      
            return {
              ...eq,
              status,
              device_hostname: eq.device_hostname ?? '',
              createdAt: eq.createdAt.toISOString(),
              updatedAt: eq.updatedAt.toISOString()
            };
          })
        );

      await logExecution({ ip: ipRequest,class: 'EquipamentoController',function: 'listEquipamentos', process: 'lista todos equipamentos com status',description: 'sucess' });

      return reply.status(200).send({ task: 'SUCESS.', resp: equipamentosWithStatus });

    } catch (err: any) {
      await logExecution({ip: ipRequest,class: 'EquipamentoController',function: 'listEquipamentos',process: 'erro ao listar equipamentos',description: 'error' });

      return reply.status(500).send({ resp: 'Erro ao buscar equipamentos.' });
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const iprequest = request.ip
    const equipamento = request.body as EquipamentoUpdateDTO;

    if (!equipamento.device_id ) {
      return reply.status(400).send({ resp: "Campos obrigatórios: device_id" });
    }
    try {
      //Pesquisa equipamento pelo ID e pega o ID da central e ip do equipamento
      const service = new EquipamentoServices();
      //objeto equipamento
      const equipamentodb = await service.findByIdYD(equipamento.device_id );
      // ip do equipamento
      const equipamentoip = equipamentodb?.ip;
      if (!equipamentoip) {
        return reply.status(404).send({ resp: "Equipamento não encontrado." });
      }
      //pega o id da central
      const idcentral = equipamentodb?.central_id
      console.log('idcentral: ', idcentral)
      if (!idcentral) {
        return reply.status(404).send({ resp: "Central não encontrada para este equipamento." });
      }
      const servicecentral = new CentralServices();
      //pega os dados da central pra pegar o ip da central
      const central        = await servicecentral.getById(idcentral);
      const ipcentralmrd   = central?.ip_VPN;
      console.log(ipcentralmrd)
      if (!ipcentralmrd) {
        return reply.status(404).send({ resp: "Central não encontrada no db." });
      }
      //montar body pra enviar pra central e atualizar o equipamento
      const equipamentoUpdateDTO: EquipamentoUpdateDTO = {
        ip: equipamento.ip || equipamentoip, // se o ip não for passado, usa o do db
        mac: equipamento.mac,
        device_hostname: equipamento.device_hostname ?? equipamentodb.device_hostname ?? undefined,
      }
      //ipcentral com body do equipamento faz request pra central
      const requestequipamento = new RequestEquipamento()
      const equipamentoscentral = await requestequipamento.updateEquipamento(equipamentoUpdateDTO, ipcentralmrd)

      console.log('retorno do banco pelo id pra verificar o objeto: ',equipamentoscentral)

      const equipamentoupdatdb = await service.update(equipamento);

      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "update", process: "atualiza equipamento", description: "sucess", });;
       return reply.status(200).send({ task: "SUCESS.", resp: equipamentoupdatdb});
    } catch (err: any) {
      await logExecution({ ip: iprequest, class: "EquipamentoController", function: "update", process: "atualiza equipamento", description: "error", });;
      return reply.status(404).send({ task: "ERROR.",resp: "Equipamento não encontrado." });
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
