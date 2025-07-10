export interface UsuarioDTO {
  name:             string
  idYD:             string
  password:         string
  begin_time:       string
  end_time:         string
  bio?:             string
  base64?:          string
  acessos:          string[]
 // debug?:            string,
  
}
export interface UsuarioIdCentralDTO extends UsuarioDTO{
  user_idEquipamento?:   string
  idcentral:             string
}
export interface AcessoDoc {
  central:              string;
  equipamento:          string;
  user_idEquipamento?:  string;
  begin_time:           string;
  end_time:             string;
}
export interface UsuarioComAcesso {
  name:      string;
  idYD:      string;
  password:  string;
  bio:       string;
  base64:    string;
  acessos: Array<{
    central:            string;
    equipamento:        string;
    user_idEquipamento: string;
    begin_time:         string;
    end_time:           string;
  }>;
}
export interface CentralInfo {
  device_id:    string;
  ipCentralMRD: string;
  nomeEdificio: string;
  numero:       string;
  rua?:         string;
  bairro?:      string;
}
export interface UsuarioResumo {
  name:       string;
  idYD:       string;
}
export interface UsuarioAdm {
  usuario:       string;
  senha:       string;
}
