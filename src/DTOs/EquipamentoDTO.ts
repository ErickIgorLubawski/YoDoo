export interface EquipamentoDTO {
    device_id: number;
    ip:        string;
  }
  
  export interface EquipamentoUpdateDTO extends EquipamentoDTO {
    id: string;
  }
  