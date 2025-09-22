import axios from 'axios';
import { ServerResponse } from 'http';
import { EquipamentoUpdateDTO } from '../DTOs/EquipamentoDTO';

export class RequestEquipamento {
  
  async searchInfoEquipamento(ipcentralmrd: any) {
    //const port = process.env.CENTRAL_PORT
    try {
      const url = `http://${ipcentralmrd}/findEqs`;
      console.log('contrucão da URL: ',url);
      const response = await axios.get(url);
      console.log('resposta da central ', response.data);
      return response.data;
    } catch (err) {
      return {ServerResponse}
    }
  }
  async searchInfoCentral(ipcentralmrd: string) {
    
    try {
      //Podemos 
      console.log('IP da central:', ipcentralmrd)
      const url = `http://${ipcentralmrd}/central`;
      console.log('URL:', url);
      const response = await axios.get(url);
      console.log('confirmação',response.data)
      return response.data;

    } catch (err) {
      //
      return {ServerResponse}
    }
  }
  async updateEquipamento(EquipamentoUpdateDTO : EquipamentoUpdateDTO, ipcentralmrd: string ) {
    try {
      const url = `http://${ipcentralmrd}/cadastro_eq`;
      console.log('URL:', url);
      const body = EquipamentoUpdateDTO;
      console.log('body:', body);
      const response = await axios.put(url,body, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('r',response)
      console.log('1',response.data)


       return response.data;
    } catch (err) {
      return {ServerResponse}
    }
  }
  async Status(ip: string): Promise<'online' | 'offline'> {
    try {
      const url = `http://${ip}/status`;
      await axios.get(url, { timeout: 9000 });
      console.log(`[Status Check] Central ${ip} respondeu. Status: online.`);
      return 'online';
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // O erro é do tipo AxiosError, podemos checar a resposta.
        if (err.response) {
          // O servidor respondeu com um status de erro (4xx, 5xx).
          // A sua requisição para tratar 404 é coberta aqui.
          console.warn(`[Status Check] Central ${ip} retornou status ${err.response.status}. Marcando como offline.`);
        } else if (err.request) {
          // A requisição foi feita, mas não houve resposta (timeout, sem conexão).
          console.warn(`[Status Check] Central ${ip} não respondeu. Marcando como offline.`);
        }
      } else {
        // Erro inesperado não relacionado ao Axios.
        console.error(`[Status Check] Erro inesperado ao verificar ${ip}.`, err);
      }
      return 'offline';
    }
  }
  async getBulkEquipamentoStatus(ipCentral: string): Promise<any[] | null> {
    try {
      const url = `http://${ipCentral}/statusequipamentos`;
      const response = await axios.get(url, { timeout: 9000 });
  
      if (response.data?.task === 'SUCCESS' && Array.isArray(response.data.resp)) {
        console.log(`[Bulk Status] Sucesso ao buscar status da central ${ipCentral}.`);
        return response.data.resp;
      }
  
      console.error(`[Bulk Status] Resposta em formato inesperado da central ${ipCentral}:`, response.data);
      return null;
  
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Incluindo o status 404, conforme solicitado.
          console.warn(`[Bulk Status] Central ${ipCentral} respondeu com erro ${err.response.status}. Impossível obter status dos equipamentos.`);
        } else if (err.request) {
          console.warn(`[Bulk Status] Falha de conexão com a central ${ipCentral}.`);
        }
      } else {
        console.error(`[Bulk Status] Erro inesperado ao buscar status em ${ipCentral}.`, err);
      }
      
      // Retornar 'null' é a forma correta de sinalizar para a lógica de negócio
      // que a central (e consequentemente todos os seus equipamentos) está inacessível/offline.
      return null;
    }
  }
}