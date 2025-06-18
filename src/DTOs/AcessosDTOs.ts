// src/DTOs/AcessoDTO.ts
export interface AcessoDTO {
  id:             string;             
  equipamentoId:  string; 
  begin_time:     string;
  end_time:       string;
  centralId?:     string;
  userIdCentral?: number;
}
