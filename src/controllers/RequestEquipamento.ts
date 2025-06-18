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
      console.log(ipcentralmrd)
      const url = `http://${ipcentralmrd}/central`;
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
      await axios.get(url, { timeout: 1000 }); // timeout curto evita travar
      
      return 'online';
    } catch (err) {
      return 'offline';
    }
  }
  async StatusEquipamento(ipCentral: string, ipEquipamento: string): Promise<'online' | 'offline'> {
    try {
      const url = `http://${ipCentral}/equipamentos?device_id=${ipEquipamento}`;
      console.log('url do request: ',url)
      await axios.get(url, { timeout: 2000 });
      return 'online';
    } catch {
      return 'offline';
    }
  }
}