// src/DTOs/AcessoDTO.ts
export interface AcessoDTO {
  id: string;             // ID único desse objeto de acesso
  equipamentoId: string;  // o "id" que veio no array de acessos
  begin_time: string;
  end_time: string;
  // você pode deixar centralId e userIdCentral undefined aqui,
  // ou preencher depois numa chamada à central se precisar
  centralId?: string;
  userIdCentral?: number;
}
