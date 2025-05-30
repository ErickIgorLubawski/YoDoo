export interface UsuarioDTO {
  name:             string
  idYD:             string
  password:         string
  begin_time:       string
  end_time:         string
  bio?:             string
  base64?:          string
  acessos:          string[]
  
}

export interface UsuarioIdCentralDTO extends UsuarioDTO{
  user_idCentral:   string
  idcentral:        string
}
export interface AcessoDoc {
  central:     string;
  equipamento: string;
  userID:      string;
  begin_time:  string;
  end_time:    string;
}

// export interface UsuarioCentralDTO{
//     idYD?:             string
//     password?:         string
//     begin_time?:       string
//     end_time?:         string
//     bio?:              string
//     base64?:           string
//     acessos:           string[]
//     user_idCentral?:   number
// }

// export interface DeleteUsuarioDTO extends UsuarioDTO{
//   idYD:             string
//   acessos:          string[]

// }



