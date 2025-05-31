// RequestEquipamento.ts
import axios from 'axios';
import { ServerResponse } from 'http';

export class RequestEquipamento {
  async searchEquipamentoCentral(ipcentralmrd: any) {
    try {
      const url = `http://${ipcentralmrd}/findEqs`;
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      return {ServerResponse}
    }
  }
}