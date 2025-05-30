import { equipamentos } from './../../node_modules/.prisma/client/index.d';
// src/services/CentralServices.ts
import { prisma }      from '../config/db';
import { UsuarioDTO, UsuarioIdCentralDTO,AcessoDoc}  from "../DTOs/UsuarioDTO";
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

//   async  createUserAcess(data: UsuarioIdCentralDTO) {
//     // Pega o equipamentoId e o idCentral correspondentes (aqui só 1, mas pode adaptar)
//     const equipamentoId = data.acessos[0];
//     const idCentral = data.idcentral
  
//     // Monta o objeto final para “acessos”
//     const equipamento = {
//       [equipamentoId]: {
//         user_idCentral: data.user_idCentral,
//         idcentral:      idCentral,
//         begin_time:     data.begin_time,
//         end_time:       data.end_time,
//       }
//     };

//     // Salva no Mongo (via Prisma)
//     return prisma.usuarios.create({
//       data: {
//         name:     data.name,
//         idYD:     data.idYD,
//         password: data.password,
//         bio:      data.bio,
//         base64:   data.base64,
//         acessos:  equipamento   // aqui vai o JSON com chave dinâmica
//       }
//     }
//   );
// }
async createUserAcess(data: UsuarioIdCentralDTO) {
  // Monta o array de objetos de acesso
  const acessosDocs: AcessoDoc[] = data.acessos.map(equipId => ({
    central:     data.idcentral,                // url da central
    equipamento: equipId,                       // equipamento único
    userID:      data.user_idCentral,           // string
    begin_time:  data.begin_time,
    end_time:    data.end_time,
  }));
  console.log('acessos',acessosDocs)
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

async addAccess(data: UsuarioIdCentralDTO) {
  const acessosDocs: AcessoDoc[] = data.acessos.map(equipId => ({
    central:     data.idcentral,                // url da central
    equipamento: equipId,                       // equipamento único
    userID:      data.user_idCentral,           // string
    begin_time:  data.begin_time,
    end_time:    data.end_time,
  }));
  console.log('acessos',acessosDocs)

  return prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: {
      acessos: {
        push: acessosDocs as any 
      }
    }
  });
}
async updateUser(data: UsuarioIdCentralDTO) {
  // Converte user_idCentral para número, se necessário

  return prisma.usuarios.update({
    where: { idYD: data.idYD },
    data: {
      name:          data.name,
      password:      data.password,
      bio:           data.bio,
      base64:        data.base64,
      user_idCentral: data.user_idCentral,
      // Se quiser também atualizar o primeiro acesso no array,
      // descomente e adapte:
      //
      acessos: {
        update: {
          where: { equipamento: data.acessos[0] },
          data: {
            userID:     data.user_idCentral,
            begin_time: data.begin_time,
            end_time:   data.end_time,
          }
        }
      }
    }
  });
}
}
  // async createUserAcess(data: UsuarioIdCentralDTO) {
  //   // Aqui, `acessos` será um array de objetos
  //   return prisma.usuarios.create({
  //     data: {
  //       name:     data.name,
  //       idYD:     data.idYD,
  //       password: data.password,
  //       bio:      data.bio,
  //       base64:   data.base64,
  //       acessos:  data.acessos      // array de JSON de AcessoDTO
  //     }
  //   });
  // }
//   async updateAcesso(data: UsuarioIdCentralDTO) {
//   const equipamentoId = data.acessos[0];

//   // Busca os acessos existentes do usuário
//   const usuarioExistente = await prisma.usuarios.findFirst({
//     where: { idYD: data.idYD },
//     select: { acessos: true },
//   });

//   const acessosExistentes = usuarioExistente?.acessos;
 

//   const acessosAtualizados = {
//     ...(acessosExistentes && typeof acessosExistentes === 'object' ? acessosExistentes : {}),
//     [equipamentoId]: {
//       ...(acessosExistentes && typeof acessosExistentes === 'object' ? (acessosExistentes as Record<string, any>)[equipamentoId] : {}),
//       user_idCentral: data.user_idCentral,
//       idcentral: data.idcentral,
//       begin_time: data.begin_time,
//       end_time: data.end_time,
//     },
//   };

//   return await prisma.usuarios.update({
//     where: { idYD: data.idYD },
//     data: {
//       acessos: acessosAtualizados,
//     },
//   });
// }
  


