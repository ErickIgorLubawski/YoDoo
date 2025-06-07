import axios from 'axios';
import { ServerResponse } from 'http';
import { EquipamentoUpdateDTO } from '../DTOs/EquipamentoDTO';

export class RequestEquipamento {
  
  //verifica esse parametro, qualquer coisa fazemos 
  
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
}