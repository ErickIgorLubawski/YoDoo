// src/services/CentralServices.ts
import { prisma }      from '../config/db';
import { UsuarioDTO, UsuarioIdCentralDTO }  from "../DTOs/UsuarioDTO";
import { AcessoDTO }   from '../DTOs/AcessosDTOs';
import { v4 as uuid }  from "uuid";


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

  // async update(data: UsuarioDTO) {
  //   const { name, idYD, password, begin_time, end_time, acessos, bio, base64 } = data;
  //   return await prisma.usuarios.update({
  //     where: { idYD },
  //     data: { name, idYD, password, acessos, bio, base64  }
  //   });
  // }

  async delete(idYD: string) {
    return await prisma.usuarios.delete({ where: { idYD } });
  }

  async  createUserAcess(data: UsuarioIdCentralDTO) {
    // Pega o equipamentoId e o idCentral correspondentes (aqui só 1, mas pode adaptar)
    const equipamentoId = data.acessos[0];
    const idCentral = data.idcentral
  
    // Monta o objeto final para “acessos”
    const equipamento = {
      [equipamentoId]: {
        user_idCentral: data.user_idCentral,
        idcentral:      idCentral,
        begin_time:     data.begin_time,
        end_time:       data.end_time,
      }
    };

    // Salva no Mongo (via Prisma)
    return prisma.usuarios.create({
      data: {
        name:     data.name,
        idYD:     data.idYD,
        password: data.password,
        bio:      data.bio,
        base64:   data.base64,
        acessos:  equipamento   // aqui vai o JSON com chave dinâmica
      }
    }
  );
}
async createAccesses(data: UsuarioIdCentralDTO) {
  const equipamentoId = data.acessos[0];
  const idCentral = data.idcentral;

  const novoAcesso = {
    [equipamentoId]: {
      user_idCentral: data.user_idCentral,
      idcentral: idCentral,
      begin_time: data.begin_time,
      end_time: data.end_time,
    }
  };

  // Primeiro busca os acessos existentes
  const usuarioExistente = await prisma.usuarios.findFirst({
    where: { idYD: data.idYD },
    select: { acessos: true },
  });

  // Faz o merge dos acessos existentes com o novo
  const acessosAtualizados = {
    ...(usuarioExistente?.acessos && typeof usuarioExistente.acessos === 'object' ? usuarioExistente.acessos : {}), // <- garante que seja objeto
    ...novoAcesso,
  };

  // Atualiza o usuário com os acessos atualizados
  return await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: {
      acessos: acessosAtualizados,
    }
  });
  
  }
  async updateAcesso(data: UsuarioIdCentralDTO) {
  const equipamentoId = data.acessos[0];

  // Busca os acessos existentes do usuário
  const usuarioExistente = await prisma.usuarios.findFirst({
    where: { idYD: data.idYD },
    select: { acessos: true },
  });

  const acessosExistentes = usuarioExistente?.acessos;
 

  const acessosAtualizados = {
    ...(acessosExistentes && typeof acessosExistentes === 'object' ? acessosExistentes : {}),
    [equipamentoId]: {
      ...(acessosExistentes && typeof acessosExistentes === 'object' ? (acessosExistentes as Record<string, any>)[equipamentoId] : {}),
      user_idCentral: data.user_idCentral,
      idcentral: data.idcentral,
      begin_time: data.begin_time,
      end_time: data.end_time,
    },
  };

  return await prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: {
      acessos: acessosAtualizados,
    },
  });
}
  
}

