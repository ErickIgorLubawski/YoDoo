import { prisma } from '../config/db';
import { UsuarioDTO, UsuarioIdCentralDTO,AcessoDoc, UsuarioComAcesso,UsuarioAdm,UsuarioResumo}  from "../DTOs/UsuarioDTO";
import bcrypt from 'bcrypt';
import { logExecution } from '../utils/logger';


export class UsuarioServices {

  async findByName(name: string): Promise<UsuarioResumo[]> {
    try {
      const usuarios = await prisma.usuarios.findMany({
        where: {
          name: {
            contains: name,
            mode: 'insensitive', // Garante que a busca não seja case-sensitive
          },
        },
        select: {
          idYD: true,
          name: true,
          // password: true, // Considere omitir a senha se não for necessária no front-end
           acessos: true,
           createdAt: true,
           updatedAt: true,
           base64: true,
        }
      });
      return usuarios;
    } catch (error: any) {
      logExecution({ ip: 'N/A', class: "UsuarioServices", function: "findByName", process: "Busca por nome", description: `Erro ao buscar usuários por nome: ${error.message}` });
      throw new Error('Erro no serviço ao buscar usuários por nome.');
    }
  }

  
async createusuariobiometria(UsuarioDTO: UsuarioDTO) {
  return await prisma.usuarios.create({ data: UsuarioDTO });
}
async findByIdYD(idYD: string) {
  return await prisma.usuarios.findFirst({where: { idYD: idYD }});
}

async list() {
  return await prisma.usuarios.findMany({
    select: {
      idYD: true,
      name: true,
      password: true,
      acessos: true,
      createdAt: true,
      updatedAt: true,
      base64: true, // Inclui base64 para retornar a imagem
      // retira base64,user_idEquipamento e id banco omitindo-os do select
    }
  });
}

async getEquipamentoIdsByUserIdYd(idYD: string) {
 try {
   // 1. Busca o usuário, mas seleciona APENAS o campo 'acessos' para otimizar a consulta.
   const usuario = await prisma.usuarios.findUnique({
     where: { idYD: idYD },
     select: {
       acessos: true,
     },
   });

   // 2. Se o usuário não for encontrado ou não tiver acessos, retorna um array vazio.
   if (!usuario || !usuario.acessos || (usuario.acessos as any[]).length === 0) {
     return [];
   }

   // 3. Mapeia o array de objetos de acesso para um array de strings com os IDs dos equipamentos.
   const equipamentoIds = (usuario.acessos as any[]).map(acesso => acesso.equipamento);

   return equipamentoIds;

 } catch (error) {
   console.error(`[UsuarioServices] Erro ao buscar IDs de equipamento para o usuário ${idYD}:`, error);
   throw new Error('Erro no serviço ao buscar os equipamentos do usuário.');
 }
}

async getById(idYD: string) {
  console.log('ID: ', idYD)
    return prisma.usuarios.findUnique({
      where: { idYD },
      select: {
        id: true,
        name: true,
        idYD: true,
        password: true,
        acessos: true,
        createdAt: true,
        updatedAt: true
      }
    });
}
async delete(idYD: string) {
  // 1. Busca o usuário atual
  const usuario = await prisma.usuarios.findUnique({
    where: { idYD },
  });

  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  // 2. Insere na tabela de deletados
  await prisma.usuarios_deletados.create({
    data: {
      id: usuario.id,
      idYD: usuario.idYD,
      name: usuario.name,
      password: usuario.password,
      base64: usuario.base64,
      acessos: usuario.acessos ?? {}, // <- Aqui tratamos caso esteja null
    },
  });

  // 3. Remove da tabela original
  return await prisma.usuarios.delete({
    where: { idYD },
  });
}
async createUserAcess(data: UsuarioIdCentralDTO) {
  // garante que o tamanho de idcentral e acessos é o mesmo
  if (data.idcentral.length !== data.acessos.length) {
    throw new Error('Número de centrais não corresponde ao número de equipamentos');
  }

  // limpa idYD (remove letras, espaços, símbolos)
  const cleanIdYD = data.idYD.replace(/\D/g, '');

  const acessosDocs: AcessoDoc[] = data.acessos.map((equipId, index) => ({
    central: data.idcentral[index],
    equipamento: equipId,
    user_idEquipamento: cleanIdYD, // 👈 já entra limpinho
    begin_time: data.begin_time,
    end_time: data.end_time,
  }));

  return prisma.usuarios.create({
    data: {
      name: data.name,
      idYD: cleanIdYD, // 👈 salva só números
      password: data.password,
      base64: data.base64,
      acessos: acessosDocs as any
    }
  });
}

async  adicionarAcesso(data: UsuarioIdCentralDTO) {
  // 1. Cria o novo acesso como objeto
  const novoAcesso: AcessoDoc = {
    central:     Array.isArray(data.idcentral) ? data.idcentral[0] : data.idcentral,
    equipamento: data.acessos[0],  // supondo um único equipamento por vez
    user_idEquipamento:      data.idYD,
    begin_time:  data.begin_time,
    end_time:    data.end_time,
  };

  // 2. Busca o usuário existente
  const usuario = await prisma.usuarios.findUnique({
    where: { idYD: data.idYD },
  });

  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  // 3. Adiciona o novo acesso ao array atual de acessos
  const acessosAtualizados = [
    ...(Array.isArray(usuario.acessos) ? usuario.acessos : []),
    novoAcesso,
  ];

  // 4. Atualiza o documento no banco
  const usuarioAtualizado = await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: {
      acessos: acessosAtualizados as any,
    },
  });

  return usuarioAtualizado;
}
async  atualizarAcessoEspecificoold(data: UsuarioIdCentralDTO) {
  // 1. Buscar o usuário pelo idYD
  const usuario = await prisma.usuarios.findUnique({
    where: { idYD: data.idYD },
  });
  console.log('usuario', usuario);
  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  // 2. Atualiza dados do usuário, se necessário
  const atualizacoes: any = {};

  if (data.name && data.name !== usuario.name) {
    atualizacoes.name = data.name;
  }

  if (data.password && data.password !== usuario.password) {
    atualizacoes.password = data.password;
  }

  const equipamentoAlvo = data.acessos[0];
  console.log('equipamentoAlvo', equipamentoAlvo);

  // 3. Atualiza apenas o objeto de acesso com o equipamento correspondente
  const acessosAtualizados = (usuario.acessos as unknown as AcessoDoc[]).map(acesso => {
    if (acesso.equipamento === equipamentoAlvo) {
      return {
        ...acesso,
        begin_time: data.begin_time,
        end_time: data.end_time,
        central: data.idcentral ?? acesso.central,
      };
    }
  console.log('acessosAtualizados', acessosAtualizados);

    return acesso;
  });

  atualizacoes.acessos = acessosAtualizados;
  console.log('acessosAtualizados', acessosAtualizados);

  // 4. Atualizar no banco
  const usuarioAtualizado = await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: atualizacoes,
  });
  console.log('usuarioAtualizado', usuarioAtualizado);

  return usuarioAtualizado;
}
async atualizarAcessoEspecifico(data: UsuarioIdCentralDTO) {
  // 1) Busca o usuário pelo idYD
  const usuario = await prisma.usuarios.findUnique({
    where: { idYD: data.idYD },
  });
  if (!usuario) {
    throw new Error("Usuário não encontrado");
  }

  // 2) Monta o objeto de update, adicionando só o que vier
  const atualizacoes: any = {};
  if (data.name && data.name !== usuario.name) {
    atualizacoes.name = data.name;
  }
  if (data.password && data.password !== usuario.password) {
    atualizacoes.password = data.password;
  }
  if (data.base64 && data.base64 !== usuario.base64) {
    atualizacoes.base64 = data.base64;
  }

  // 3) Atualiza só o acesso desejado
  const equipamentoAlvo = data.acessos[0]; // o equipamento que veio no body
  // transforma o JSON em array tipado
  const acessosOriginais = usuario.acessos as unknown as AcessoDoc[];
  const acessosAtualizados = acessosOriginais.map(acesso => {
    if (acesso.equipamento === equipamentoAlvo) {
      return {
        ...acesso,
        // só sobrescreve estes campos
        begin_time: data.begin_time ?? acesso.begin_time,
        end_time:   data.end_time   ?? acesso.end_time,
        central:    data.idcentral  ?? acesso.central,
      };
    }
    return acesso;
  });

  // 4) adiciona essa alteração ao objeto de update
  atualizacoes.acessos = acessosAtualizados;

  // 5) Grava tudo de volta
  const usuarioAtualizado = await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: atualizacoes,
  });
  return {
    id: usuarioAtualizado.id,
    name: usuarioAtualizado.name,
    idYD: usuarioAtualizado.idYD,
    password: usuarioAtualizado.password,
    acessos: usuarioAtualizado.acessos,
    createdAt: usuarioAtualizado.createdAt,
    updatedAt: usuarioAtualizado.updatedAt,
    
  }
}
async  atualizarUsuarioEAcessos(data: UsuarioIdCentralDTO) {
  const usuario = await prisma.usuarios.findUnique({
    where: { idYD: data.idYD },
  });

  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  // 2. Prepara os dados a serem atualizados
  const atualizacoes: any = {};

  if (data.name && data.name !== usuario.name) {
    atualizacoes.name = data.name;
  }

  if (data.password && data.password !== usuario.password) {
    atualizacoes.password = data.password;
  }

  // 3. Substitui o array de acessos, se enviado
  if (Array.isArray(data.acessos) && data.acessos.length > 0) {
    const novosAcessos: AcessoDoc[] = data.acessos.map((equipId, index) => ({
      central: Array.isArray(data.idcentral) ? data.idcentral[index] : data.idcentral,
      equipamento: equipId,
      begin_time: data.begin_time,
      end_time: data.end_time,
    }));

    atualizacoes.acessos = novosAcessos;
  }

  // 4. Atualiza no banco
  const usuarioAtualizado = await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: atualizacoes,
  });

  return usuarioAtualizado;
}
async findUsersByEquipamento(equipamentoId: string): Promise<UsuarioComAcesso[]> {
  try {
    const usuariosnoequipamentoidjson = await prisma.$runCommandRaw({
      aggregate: "usuarios_2_1", // O nome da coleção
      pipeline: [
        { $match: { "acessos.equipamento": equipamentoId } },
        {
          $project: {
            _id:      0, // Exclui o _id original
            name:     1,
            idYD:     1,
            base64:  1, // Inclui base64 para retornar a imagem
            createdAt: 1, // Retorna o campo createdAt (virá como {$date: ...})
            updatedAt: 1, // Retorna o campo updatedAt (virá como {$date: ...})
            acessos: {
              $filter: {
                input: "$acessos",
                as:    "ac",
                cond:  { $eq: ["$$ac.equipamento", equipamentoId] }
              }
            }
          }
        }
      ],
      cursor: {}
    });

    // NOVO: Processamento para formatar as datas
    const rawUsuarios = (usuariosnoequipamentoidjson as any).cursor.firstBatch;
    
    const usuariosFormatados: UsuarioComAcesso[] = rawUsuarios.map((usuario: any) => {
      // Verifica se createdAt e updatedAt são objetos com a chave "$date"
      if (usuario.createdAt && typeof usuario.createdAt === 'object' && usuario.createdAt['$date']) {
          usuario.createdAt = new Date(usuario.createdAt['$date']).toISOString();
      }
      if (usuario.updatedAt && typeof usuario.updatedAt === 'object' && usuario.updatedAt['$date']) {
          usuario.updatedAt = new Date(usuario.updatedAt['$date']).toISOString();
      }
      // Se o seu Prisma `schema.prisma` tem `@map("_id")`, e você precisa do `id` sem o `$oid`
      // você também pode transformá-lo aqui se o $project incluir _id: 1.
      // Se você precisa do ID do MongoDB, mas não como ObjectId, pode ser assim:
      // if (usuario._id && typeof usuario._id === 'object' && usuario._id['$oid']) {
      //     usuario.id = usuario._id['$oid'];
      // }
      // delete usuario._id; // Remove o campo _id se você mapeou para 'id' no modelo e não quer o original.

      return usuario;
    });

    return usuariosFormatados;

  } catch (error: any) {
    throw new Error(`Erro ao buscar usuários por equipamento: ${error.message}`);
  }
}
async findCentralUsers(deviceId: string) {
  // 1) Encontra a central (esta parte está correta)
  const central = await prisma.centrais.findUnique({
    where: { device_id: deviceId },
    select: {
      device_id: true,
      nomeEdificio: true,
      numero: true,
      rua: true,
      bairro: true
    },
  });

  if (!central) {
    throw new Error(`Central com device_id="${deviceId}" não encontrada`);
  }

  // 2) Busca os usuários com a pipeline de agregação corrigida
  const raw = await prisma.$runCommandRaw({
    aggregate: "usuarios_2_1", // O nome da sua view/collection
    pipeline: [
      {
        $match: {
          acessos: { $elemMatch: { central: deviceId } }
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          idYD: 1,
          // CORREÇÃO: Converte o campo de data para uma string no formato ISO 8601
          createdAt: { 
              $dateToString: { 
                  format: "%Y-%m-%dT%H:%M:%S.%LZ", 
                  date: "$createdAt" 
              } 
          },
          updatedAt: { 
              $dateToString: { 
                  format: "%Y-%m-%dT%H:%M:%S.%LZ", 
                  date: "$updatedAt" 
              } 
          },
          // Esta parte que filtra os acessos para trazer apenas os da central relevante está ótima!
          acessos: {
            $filter: {
              input: "$acessos",
              as: "ac",
              cond: { $eq: ["$$ac.central", deviceId] }
            }
          }
        }
      }
    ],
    cursor: {}
  });

  const usuarios = (raw as any).cursor.firstBatch as UsuarioResumo[];

  return usuarios;
}
async findnameAdm(usuario: string) {
  return await prisma.administradores.findFirst({where: { usuario: usuario }});
}
 async createAdm(data: UsuarioAdm) { // Usando seu DTO UsuarioAdm
    
  // 1. Define o número de "rodadas de sal". 10 é um valor seguro e padrão.
  const saltRounds = 10;

  // 2. Cria o hash da senha que veio no corpo da requisição
  const hashedPassword = await bcrypt.hash(data.senha, saltRounds);

  // 3. Salva o usuário no banco, substituindo a senha original pelo hash
  return await prisma.administradores.create({
    data: {
      ...data, // Copia todos os outros dados do DTO (como o usuário)
      senha: hashedPassword, // Sobrescreve o campo 'senha' com o HASH
    },
  });
}
public async validateAdmCredentials(usuario: string, senha: string): Promise<{ id: string; usuario: string; } | null> {
  const process = 'validateAdmCredentials';
  const description = `Tentativa de validação para o usuário: ${usuario}`;

  // Log 1: Confirma que a função foi chamada
  console.log(`\n--- [DEBUG] INÍCIO DO PROCESSO: validateAdmCredentials para usuário "${usuario}" ---`);

  try {
    // Log 2: Antes de tocar no banco de dados
    console.log('[DEBUG] Passo 1: Preparando para buscar usuário no Prisma.');
    const user = await prisma.administradores.findFirst({
      where: { usuario: usuario },
    });

    // Log 3: Mostra o que o Prisma retornou. ESSENCIAL!
    console.log('[DEBUG] Passo 2: Resultado da busca no Prisma:', user);

    if (!user) {
      // Log 4: Se o usuário é nulo, este é o fim do caminho.
      console.log('[DEBUG] FIM DA LINHA: Usuário não encontrado no banco. Retornando null.');
      logExecution({ ip: 'N/A', class: "UsuarioServices", function: process, process: description, description: `Usuário "${usuario}" não encontrado.` });
      return null;
    }

    // Log 5: Se o usuário foi encontrado, mostra os dados que serão comparados.
    console.log(`[DEBUG] Passo 3: Usuário "${user.usuario}" encontrado. Preparando para comparar a senha.`);
    console.log(`     [DEBUG] Senha recebida na requisição: "${senha}"`);
    console.log(`     [DEBUG] Hash armazenado no banco: "${user.senha}"`);

    const isMatch = await bcrypt.compare(senha, user.senha);

    // Log 6: Mostra o resultado da comparação do bcrypt. ESSENCIAL!
    console.log('[DEBUG] Passo 4: Resultado do bcrypt.compare:', isMatch);

    if (!isMatch) {
      // Log 7: Se a senha não bate, este é o fim do caminho.
      console.log('[DEBUG] FIM DA LINHA: Senha não corresponde (isMatch = false). Retornando null.');
      logExecution({ ip: 'N/A', class: "UsuarioServices", function: process, process: description, description: `Senha inválida para o usuário "${usuario}".` });
      return null;
    }
    
    // Log 8: Se tudo deu certo.
    console.log('[DEBUG] SUCESSO: Credenciais válidas. Retornando dados do usuário.');
    logExecution({ ip: 'N/A', class: "UsuarioServices", function: process, process: description, description: `Usuário "${usuario}" autenticado com sucesso.` });
    return {
      id: user.id,
      usuario: user.usuario,
    };

  } catch (error: any) {
    // Log 9: Se algo quebrar de forma inesperada.
    console.error('[DEBUG] ERRO FATAL: Ocorreu uma exceção no bloco try/catch.', error);
    logExecution({ ip: 'N/A', class: "UsuarioServices", function: process, process: description, description: `ERRO INESPERADO: ${error.message}` });
    throw new Error(`Erro interno no processo de validação: ${error.message}`);
  }


}}


