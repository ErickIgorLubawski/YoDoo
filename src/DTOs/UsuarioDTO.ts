export interface UsuarioDTO {
    name:        string
    idYD:        string
    password:    string
    begin_time:  string
    end_time:    string
    acessos:     string[]
    bio:         string
    base64:      string
  }
  export interface UsuarioUpdateDTO extends UsuarioDTO {
    id:     string;
  }

