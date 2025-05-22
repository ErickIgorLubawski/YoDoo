import { error } from "console";
import { UsuarioDTO } from "../DTOs/UsuarioDTO";
import { EquipamentoServices } from "../services/EquipamentoServices";
import { logExecution } from "../utils/logger";
import axios from 'axios';


export class RequestCentral {
  static buscaIp: any;

  async cadastraUsuarioCentral(ipequipamento: UsuarioDTO, iprequest: string) {
    //let user_idDevice: number | null = null;

    const service = new EquipamentoServices();

    const equipamentos = await service.getIpsAndCentralByDeviceIds(ipequipamento.acessos);
    //const equipmentos = '192.168.0.129'
    if (equipamentos.length === 0) {
      await logExecution({ ip: iprequest, class: "RequestCentral", function: "buscaIp", process: "busca ip para requsição central", description: "error", });;
    }
    const { central_id } = equipamentos[0];
    const ips = equipamentos.map(e => e.ip);
    // Monta o corpo da requisição
    const usuarioCentral = {
      name: ipequipamento.name,
      idYD: ipequipamento.idYD,
      begin_time: ipequipamento.begin_time,
      end_time: ipequipamento.end_time,
      acessos: ips,
      password: ipequipamento.password,
    };

    const usuariobiometria = {
     idYD: ipequipamento.idYD,
     acessos: ips,
     base64:  ipequipamento.base64
    }
    console.log('payloadcentral',usuarioCentral)
    console.log('payloadbiometria',usuariobiometria)

    // Monta a URL dinamicamente a partir do central_id
    // Exemplo: central_id = "192.168.0.129", porta fixa 557
    //URL PROD
    //const url = `http://${central_id}:557/cadastro_cl`;
    //URL SERV TESTE
    const url = `http://mrdprototype.ddns.net:557/cadastro_cl`;
    try {
      const responseusuariocentral = await axios.post(url, usuarioCentral, {
        headers: { 'Content-Type': 'application/json' },
      });
      const responseusuariobiometria = await axios.post(url, usuariobiometria, {
        headers: { 'Content-Type': 'application/json' },
      });

      const user_idDevice = responseusuariocentral.data.resp.acessos[0].user_idDevice;
        await logExecution({ ip: iprequest, class: 'RequestCentral', function: 'buscaIp', process: 'envio para central', description: 'Cadastrado na central' });
      
        console.log('print do retono',user_idDevice)
      
        if( user_idDevice > 0){
          return { sucess: true, status: 200, user_idDevice };
        }
        else{
          return { sucess: false, status: 200, user_idDevice };
        }


    } catch (err: any) {
        await logExecution({ ip: iprequest, class: 'RequestCentral', function: 'buscaIp', process: 'envio para central', description: 'usuario cadastraado na central' });
        return {success: true}
    }
  }
}
