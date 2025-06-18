
export interface CentralDTO {
    device_id:     string;
    ipCentralMRD:  string;
    nomeEdificio:  string;
    numero:        string;
    rua:           string;
    bairro:        string;
    status:       'online' | 'offline';
  }

export interface CentralinfoDTO extends  CentralDTO{
    ip_local:     string;
    ip_VPN:       string;
    mac:          string;
    version:      string;
    status:       'online' | 'offline';

  }
  export interface CentralUpdateDTO{
    device_id:          string;
    ipCentralMRD?:      string;
    nomeEdificio?:      string;
    numero?:            string;
    rua?:               string;
    bairro?:            string;
    ip_local?:          string;
    ip_VPN?:            string;
    mac?:               string;
    version?:           string;
  }
  export interface CentralWithStatusDTO {
    device_id:    string;
    ip_local:     string;
    ip_VPN?:      string;
    mac:          string;
    nomeEdificio: string;
    numero:       string;
    rua:          string;
    bairro:       string;
    version:      string;
    status:       'online' | 'offline';
  }