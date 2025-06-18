export interface EquipamentoDTO {
    device_id:         string;
    central_id:        string;
    ip:                string;
    mac:               string;
    device_hostname:   string;
    status?:            string; 
  }
  export interface EquipamentoUpdateDTO {
    device_id?:        string;        // obrigatório
    ip?:               string;
    mac?:              string;
    central_id?:       string;
    device_hostname?:  string;
  }
export interface EquipamentoWithStatusDTO {
  id:              string;
  device_id:       string;
  ip:              string;
  mac:             string;
  central_id:      string;
  device_hostname: string;
  createdAt:       string;
  updatedAt:       string;
  status:       'online' | 'offline';
}
