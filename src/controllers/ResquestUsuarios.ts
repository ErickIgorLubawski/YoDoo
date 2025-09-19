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
  
    //console.log('payload',payloads)

    const tasks: any[] = [];
    let user_idDevice: any[] = []; 
    const centralService = new CentralServices();

    for (const request of payloads) {



      try {
        const resp = await axios({
          url: request.endpoint,
          method: request.method,
          data: request.body,
          timeout: 5000
        });
        console.log(resp)

        const responseData = resp.data;

        tasks.push(responseData);
        console.log(responseData)

        const data = resp.data;
        
        if (data.task) 
        {
          tasks.push(data.task);tasks.toString()
        }
        if (request.method === 'POST' || request.method === 'PUT') {
          user_idDevice = responseData.resp.acessos;
        
        }


        await logExecution({ ip: iprequest, class: "RequestCentral", function: "sendAll", process: `${request.method} -> ${request.endpoint}`, description: `Status ${resp.status}`, });
      } catch (err: any) {
        if (err.code === "ECONNABORTED") {
          await logExecution({ip: iprequest,class: "RequestCentral",function: "sendAll",process: `Timeout ${request.method} -> ${request.endpoint}`,description: `Requisição expirada (${err.message})`,
          });
          for (const id of centralIds) {
            await centralService.setOfflineByDeviceId(id);
          }
        throw new Error(`Timeout na requisição para ${request.endpoint}`);
      }
      }
    }
    return { tasks, user_idDevice, Response};
  }
}
