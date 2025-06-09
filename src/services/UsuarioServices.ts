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
  return await prisma.usuarios.findMany({
    select: {
      idYD: true,
      name: true,
      password: true,
      bio: true,
      acessos: true,
      createdAt: true,
      updatedAt: true,
      // retira base64,user_idEquipamento e id banco omitindo-os do select
    }
  });
}
async getById(idYD: string) {
    return prisma.usuarios.findUnique({
      where: { idYD },
      select: {
        id: true,
        name: true,
        idYD: true,
        password: true,
        bio: true,
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
      bio: usuario.bio,
      base64: usuario.base64,
      user_idEquipamento: usuario.user_idEquipamento,
      acessos: usuario.acessos ?? {}, // <- Aqui tratamos caso esteja null
    },
  });

  // 3. Remove da tabela original
  return await prisma.usuarios.delete({
    where: { idYD },
  });
}
async createUserAcess(data: UsuarioIdCentralDTO) {
  // Monta o array de objetos de acesso
  const acessosDocs: AcessoDoc[] = data.acessos.map(equipId => ({
    central:          data.idcentral,                // url da central
    equipamento:      equipId,                       // equipamento único
    user_idEquipamento:   data.user_idEquipamento,           // string
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
    user_idEquipamento:      data.user_idEquipamento,
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
    bio: usuarioAtualizado.bio,
    acessos: usuarioAtualizado.acessos,
    createdAt: usuarioAtualizado.createdAt,
    updatedAt: usuarioAtualizado.updatedAt,
    
  }
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
async findCentralUsers(deviceId: string) {
  // 1) Encontra a central
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

  // 2) Busca os usuários com acessos.central === deviceId
  const raw = await prisma.$runCommandRaw({
    aggregate: "teste_usuarios",
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
}