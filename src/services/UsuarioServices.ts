import { prisma } from '../config/db';
import { UsuarioDTO, UsuarioIdCentralDTO,AcessoDoc, UsuarioComAcesso,CentralInfo,UsuarioResumo}  from "../DTOs/UsuarioDTO";


export class UsuarioServices {
async createusuariobiometria(UsuarioDTO: UsuarioDTO) {
  return await prisma.usuarios.create({ data: UsuarioDTO });
}
async findByIdYD(idYD: string) {
  return await prisma.usuarios.findFirst({where: { idYD: idYD }});
}
async list() {
  return await prisma.usuarios.findMany();
}
async getById(idYD: string) {
  return await prisma.usuarios.findFirst({ where: { idYD } });
}
async delete(idYD: string) {
    return await prisma.usuarios.delete({ where: { idYD } });
}
async createUserAcess(data: UsuarioIdCentralDTO) {
  // Monta o array de objetos de acesso
  const acessosDocs: AcessoDoc[] = data.acessos.map(equipId => ({
    central:          data.idcentral,                // url da central
    equipamento:      equipId,                       // equipamento único
    user_idCentral:   data.user_idCentral,           // string
    begin_time:       data.begin_time,
    end_time:         data.end_time,
  }));
  // Persiste no Mongo via Prisma
  return prisma.usuarios.create({
    data: {
      name:     data.name,
      idYD:     data.idYD,
      password: data.password,
      bio:      data.bio,
      base64:   data.base64,
      acessos:  acessosDocs as any     // << array de sub-documentos
    }
    
  }
);
}
async  adicionarAcesso(data: UsuarioIdCentralDTO) {
  // 1. Cria o novo acesso como objeto
  const novoAcesso: AcessoDoc = {
    central:     data.idcentral,
    equipamento: data.acessos[0],  // supondo um único equipamento por vez
    user_idCentral:      data.user_idCentral,
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
async  atualizarAcessoEspecifico(data: UsuarioIdCentralDTO) {
  // 1. Buscar o usuário pelo idYD
  const usuario = await prisma.usuarios.findUnique({
    where: { idYD: data.idYD },
  });

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
    return acesso;
  });

  atualizacoes.acessos = acessosAtualizados;

  // 4. Atualizar no banco
  const usuarioAtualizado = await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: atualizacoes,
  });

  return usuarioAtualizado;
}
//ATUALIZA ARRAY INTEIRO
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
    const novosAcessos: AcessoDoc[] = data.acessos.map(equipId => ({
      central:         data.idcentral,
      equipamento:     equipId,
      begin_time:      data.begin_time,
      end_time:        data.end_time,
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
    const usuariosnoequipamentoidjson = await prisma.$runCommandRaw({
      aggregate: "teste_usuarios",
      pipeline: [
        { $match: { "acessos.equipamento": equipamentoId } },
        {
          $project: {
            _id:      0,
            name:     1,
            idYD:     1,
            bio:      1,
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
    const usuarios = (usuariosnoequipamentoidjson as any).cursor.firstBatch as UsuarioComAcesso[];

    // Forçando o cast para nosso tipo
    return usuarios as unknown as UsuarioComAcesso[];
}
async findCentralUsers(deviceId: string): Promise<CentralInfo & { users: UsuarioResumo[] }> {
    // 1) Encontra a central exata
    const central = await prisma.centrais.findUnique({
      where: { device_id: deviceId },
      select: {
        device_id:    true,
        ipCentralMRD: true,
        nomeEdificio: true,
        numero:       true,
        rua:          true,
        bairro:       true
      },
    });

    if (!central) {
      throw new Error(`Central com device_id="${deviceId}" não encontrada`);
    }

    // 2) Agregação no Mongo para buscar apenas name/idYD dos usuários que tenham acessos.central == deviceId
    //    Usamos prisma.$runCommandRaw porque precisamos filtrar dentro do array JSON "acessos"
    const raw = await prisma.$runCommandRaw({
      aggregate: "teste_usuarios", // nome exato da coleção de usuários
      pipeline: [
        // 2a) MATCH: filtra só usuários cujo array acessos conteha um item com "central" == deviceId
        { $match: { "acessos.central": deviceId } },

        // 2b) PROJECT: mantemos só _id=0 (omitir), name e idYD dos usuários
        //     e filtramos o próprio array 'acessos' (não é obrigatório, pois aqui só precisamos dos dados do usuário,
        //     mas deixo como exemplo caso queira limitar a apenas 1 item do array)
        {
          $project: {
            _id: 0,
            name: 1,
            idYD: 1
            // Se você quisesse retornar também, por exemplo, o sub‐array de "acessos" que bate com a central,
            // poderia incluir um bloco "acessos: { $filter: … }", mas como no seu novo requisito
            // você só precisa dos usuários, deixamos de fora qualquer project sobre o array "acessos".
          }
        }
      ],
      cursor: {} // obrigatório para agregação bruta via runCommandRaw
    });

    // O resultado virá como:
    // { cursor: { firstBatch: [ { name, idYD }, { name, idYD }, … ], id: 0 }, ok: 1 }
    // O Prisma “unwrap” internamente, de modo que `raw` já tende a ser = [ { name, idYD }, … ].
    const usuarios = (raw as any).cursor.firstBatch as UsuarioResumo[];

    // 3) Retorna tudo empacotado em um único objeto
    return {
      ...central,
      rua: central.rua ?? undefined,       // Convert null to undefined
      bairro: central.bairro ?? undefined, // Convert null to undefined
      users: usuarios
    };
}
}