import axios from "axios";
import { UsuarioDTO } from "../DTOs/UsuarioDTO";
import { logExecution } from "../utils/logger";
import { EquipamentoServices } from "../services/EquipamentoServices";
import { CentralServices } from "../services/CentralServices";
import { Payload, MetodoHttp } from "../DTOs/RequestCentralDTO";

export class RequestCentral {

  async processarUsuarioCentral(data: UsuarioDTO, iprequest: string, method: MetodoHttp) {

    const payloads = await this.buildPayloads(data, method);
    const result = await this.sendAll(payloads.payloads, iprequest);

    const idacessos = payloads.centralIds
    return { result, idacessos }
  }

  async buildPayloads(data: UsuarioDTO, method: MetodoHttp) {

    const equipamentoSvc = new EquipamentoServices();
    const equipamentos = await equipamentoSvc.getIpsAndCentralByDeviceIds(data.acessos);

    // if (equipamentos.length === 0) {
    //   throw new Error("Nenhum equipamento encontrado");
    // }


    const centralIds = Array.from(new Set(equipamentos.map(e => e.central_id)));
    console.log('centralIds', centralIds)
    const centralMRD = new CentralServices();
    const centraisIps = await centralMRD.getByDeviceIds(centralIds);
    console.log('centraisIps', centraisIps)

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
      
      console.log('centraisIps', centraisIps)
      console.log('equipamentoIps',equipamentoIps)
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
            acessos: equipamentoIps,
            password: data.password
          }
        });
      } if (method === "DELETE") {
        payloads.push({
          method,
          endpoint: `${baseUrl}/del_cl`,
          body: {
            idYD: data.idYD,
            acessos: equipamentoIps,
          },
        });

      }
    }
console.log('payloads', payloads)
console.log('payloads', centralIds)


    return { payloads, centralIds };
  }
  private async sendAll(payloads: Array<Payload<any>>, iprequest: string) {

  
    console.log('payload',payloads)

    const tasks: any[] = [];
    let user_idDevice = 0;
    for (const request of payloads) {



      try {
        const resp = await axios({
          url: request.endpoint,
          method: request.method,
          data: request.body,
        });

        const responseData = resp.data;
        console.log('resp Central', responseData);

        tasks.push(responseData);
        console.log(responseData)
        const data = resp.data;
        if (data.task) {
          tasks.push(data.task);
          tasks.toString()
        }
        if (request.method === 'POST' || request.method === 'PUT') {
          user_idDevice = resp.data.resp.acessos[0].user_idDevice;
        }
        await logExecution({ ip: iprequest, class: "RequestCentral", function: "sendAll", process: `${request.method} -> ${request.endpoint}`, description: `Status ${resp.status}`, });
      } catch (err: any) {
        await logExecution({ ip: iprequest, class: "RequestCentral", function: "sendAll", process: `Erro ${request.method} -> ${request.endpoint}`, description: err.message, });
        return { tasks, user_idDevice };
      }
    }
    return { tasks, user_idDevice };
  }
}
