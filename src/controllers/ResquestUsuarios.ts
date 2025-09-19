import axios from "axios";
import { UsuarioDTO } from "../DTOs/UsuarioDTO";
import { logExecution } from "../utils/logger";
import { EquipamentoServices } from "../services/EquipamentoServices";
import { CentralServices } from "../services/CentralServices";
import { Payload, MetodoHttp } from "../DTOs/RequestCentralDTO";
import { UsuarioServices } from "../services/UsuarioServices";
import { prisma } from "../config/db";



export class RequestCentral {

  async processarUsuarioCentral(data: UsuarioDTO, iprequest: string, method: MetodoHttp) {

    const payloads = await this.buildPayloads(data, method);
    const result = await this.sendAll(payloads.payloads, iprequest, payloads.centralIds);
    const idacessos = payloads.centralIds
    
    return { result, idacessos }
  }

  async buildPayloads(data: UsuarioDTO, method: MetodoHttp) {

    if (method === "DELETE") {
      const usuarioSvc = new UsuarioServices();
      // Chama a nova função para obter a lista de IDs de equipamento dinamicamente.
      data.acessos = await usuarioSvc.getEquipamentoIdsByUserIdYd(data.idYD);
    }

    // O restante do fluxo permanece IDÊNTICO, pois ele agora receberá os dados no formato correto.
    const equipamentoSvc = new EquipamentoServices();
    const equipamentos = await equipamentoSvc.getIpsAndCentralByDeviceIds(data.acessos as any);
    
    // if (equipamentos.length === 0) {
    //   throw new Error("Nenhum equipamento encontrado");
    // }


    const centralIds = Array.from(new Set(equipamentos.map(e => e.central_id)));
    const centralMRD = new CentralServices();
    const centraisIps = await centralMRD.getByDeviceIds(centralIds);

    const centralIpMap: { [centralId: string]: string } = {};
    centraisIps.forEach(c => {
      if (c.ip_VPN) {
        centralIpMap[c.device_id] = c.ip_VPN;
      }
    });
    const centralMap: { [centralId: string]: string[] } = {};
    // centraisIps.forEach(c => {centralIpMap[c.device_id] = c.ipCentralMRD;});
    // const centralMap: { [centralId: string]: string[] } = {};
    equipamentos.forEach(eq => {
      if (!centralMap[eq.central_id]) {
        centralMap[eq.central_id] = [];
      }
      centralMap[eq.central_id].push(eq.ip);
    });
    const payloads: Array<Payload<any>> = [];

    for (const centralId in centralMap) {

      const equipamentoIps = centralMap[centralId]; // todos os IPs desse grupo
      //const baseUrl = `http://mrdprototype.ddns.net:${process.env.PORTA_CENTRAL}`;  
      // Produção        Monta URL dinâmica
      const centralIp = centralIpMap[centralId]; // IP real da central
      const baseUrl = `http://${centralIp}`;   // monta URL dinâmica
      //4408801109357360 - 192.168.0.23
      //4408801109345045 - 192.168.0.129

      if (method === "POST") {
        payloads.push({
          method,
          endpoint: `${baseUrl}/cadastro_cl`,
          body: {
            name: data.name,
            idYD: data.idYD,
            begin_time: data.begin_time,
            end_time: data.end_time,
            acessos: equipamentoIps,
            password: data.password,
          },
        });

        //   5.6.2) cadastro de biometria
        payloads.push({
          method,
          endpoint: `${baseUrl}/cad_bio`,
          body: {
            idYD: data.idYD,
            acessos: equipamentoIps,
            base64: data.base64,
          },
        });
      } if (method === "PUT") {
        payloads.push({
          method,
          endpoint: `${baseUrl}/atualiza_cl`,
          body: {
            name: data.name,
            idYD: data.idYD,
            begin_time: data.begin_time,
            end_time: data.end_time,
            base64: data.base64,
            acessos: equipamentoIps,
            password: data.password
          }
        });
      } if (method === "DELETE") {
        payloads.push({
          method,
          endpoint: `${baseUrl}/del_cl_2_1`,
          body: {
            idYD: data.idYD,
            acessos: equipamentoIps,
          },
        });

      }
    }

    return { payloads, centralIds };
  }
  private async sendAll(payloads: Array<Payload<any>>, iprequest: string, centralIds: string[]) {
    const tasks: any[] = [];
    let user_idDevice: any[] = [];
    const centralService = new CentralServices();
  
    console.log(`>>> Iniciando sendAll com ${payloads.length} payload(s)`);
    
    for (const [index, request] of payloads.entries()) {
      console.log(`\n--- [${index + 1}/${payloads.length}] Enviando requisição ---`);
      console.log(`Endpoint: ${request.endpoint}`);
      console.log(`Method: ${request.method}`);
      console.log(`Body:`, request.body);
  
      try {
        const resp = await axios({
          url: request.endpoint,
          method: request.method,
          data: request.body,
          timeout: 10000,
        });
  
        console.log(`[${index + 1}] ✔ Sucesso - Status: ${resp.status}`);
        console.log(`[${index + 1}] Response Data:`, resp.data);
  
        const responseData = resp.data;
        tasks.push(responseData);
  
        if (responseData.task) {
          tasks.push(responseData.task);
          console.log(`[${index + 1}] Task adicionada: ${responseData.task}`);
        }
  
        if (request.method === "POST" || request.method === "PUT") {
          user_idDevice = responseData.resp?.acessos || [];
          console.log(`[${index + 1}] user_idDevice atualizado:`, user_idDevice);
        }
  
        await logExecution({
          ip: iprequest,
          class: "RequestCentral",
          function: "sendAll",
          process: `${request.method} -> ${request.endpoint}`,
          description: `Status ${resp.status}`,
        });
      } catch (err: any) {
        console.error(`[${index + 1}] ✖ Erro na requisição -> ${request.endpoint}`);
        console.error("Detalhes do erro:", err.message);
  
        if (err.code === "ECONNABORTED") {
          await logExecution({
            ip: iprequest,
            class: "RequestCentral",
            function: "sendAll",
            process: `Timeout ${request.method} -> ${request.endpoint}`,
            description: `Requisição expirada (${err.message})`,
          });
  
          for (const id of centralIds) {
            console.warn(`[${index + 1}] Marcando central ${id} como OFFLINE`);
            await centralService.setOfflineByDeviceId(id);
          }
  
          throw new Error(`Timeout na requisição para ${request.endpoint}`);
        }
  
        // Re-lança para o catch da camada superior
        throw err;
      }
    }
  
    console.log("\n>>> sendAll finalizado");
    console.log("Tasks acumuladas:", tasks);
    console.log("user_idDevice final:", user_idDevice);
  
    return { tasks };
  }
  
}
