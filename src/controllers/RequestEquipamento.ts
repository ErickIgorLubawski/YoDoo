import axios from 'axios';
import { ServerResponse } from 'http';
import { EquipamentoUpdateDTO } from '../DTOs/EquipamentoDTO';

export class RequestEquipamento {
  
  async searchInfoEquipamento(ipcentralmrd: any) {
    try {
      const url = `http://${ipcentralmrd}/findEqs`;
      console.log(url);
      const response = await axios.get(url);
      console.log(response.data);
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


  
  async Status(ip: string) {
    try {
      const url = `http://${ip}/status`;
      await axios.get(url, { timeout: 9000 }); // timeout curto evita travar
      console.log('Central online:', url);
      return 'online';
    } catch (err) {
      return 'offline';
    }
  }
  async getBulkEquipamentoStatus(ipCentral: string){
    try {
        const url = `http://${ipCentral}/statusequipamentos`;
        const response = await axios.get(url, { timeout: 9000 }); // Aumentei um pouco o timeout

        console.log(`Requisição para central ${ipCentral} bem-sucedida.`, response.data);

        if (response.data && response.data.task === 'SUCCESS' && Array.isArray(response.data.resp)) {
            return response.data.resp;
        }
        console.error(` Resposta inesperada da central ${ipCentral}:`, response.data);
        return null; // Retorna nulo se o formato for inválido

    } catch (error) {
        console.error(`Falha ao conectar na central ${ipCentral} para buscar status de equipamentos.`, error);
        return null; // Retorna nulo em caso de erro na requisição
    }
}
}