
export interface CentralDTO {
    ipCentralMRD: string;
    nomeEdificio: string;
    numero:       string;
    rua:          string;
    bairro:       string;
  }
  export interface CentralUpdateDTO extends CentralDTO {
    id: string;
  }