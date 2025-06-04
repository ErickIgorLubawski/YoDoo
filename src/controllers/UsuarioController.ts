import { UsuarioDTO, UsuarioIdCentralDTO } from './../DTOs/UsuarioDTO';
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from 'jsonwebtoken';
import { UsuarioServices } from "../services/UsuarioServices";
import { logExecution } from "../utils/logger";
import { RequestCentral } from "./ResquestCentral";

interface UsuarioToken {
  UsuarioAdminToken: string;
  SenhaToken: string;
}
export class UsuarioController {

  usuarioLocal: UsuarioToken = { UsuarioAdminToken: 'Youdoo_MRD', SenhaToken: '587469', };


  async login(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip
    console.log('Dados do front end: ',request.body)

    const { usuario, senha } = request.body as { usuario: string; senha: string };
    if (!usuario || !senha) {
      return reply.status(400).send({ resp: 'Usuário e senha são obrigatórios.' });
    }

    try {
      if (usuario !== this.usuarioLocal.UsuarioAdminToken) {
        return reply.status(401).send({ resp: 'Usuario invalido.' });
      } else if (senha !== this.usuarioLocal.SenhaToken) {
        return reply.status(401).send({ resp: 'Senha invalida.' });
      }

      const secret = process.env.JWT_SECRET as string;
      const token = jwt.sign(this.usuarioLocal, secret, {
        expiresIn: '1d',
      });

      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "list", process: "Solicitação de Token", description: "sucess", });;
      return reply.status(200).send({ token })

    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "list", process: "Solicitação de Token", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'erro no servidor' });

    }
  }
  async createBiometria(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const UsuarioDTO = request.body as UsuarioDTO;

    if (!UsuarioDTO.name || !UsuarioDTO.idYD || !UsuarioDTO.password || !UsuarioDTO.begin_time || !UsuarioDTO.end_time || !UsuarioDTO.acessos) {
      return reply.status(400).send({ task: "ERROR", resp: 'campos não preenchidos' });
    }
    try {
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(UsuarioDTO, ipusuario, "POST");
      console.log('resposta da central: ',centralResult)

      const user_idCentral = centralResult.result.user_idDevice?.toString()
      const responseCentral = centralResult.result.tasks.toString()
      const idcentral = centralResult.idacessos
      console.log('status resposta da central: ',responseCentral)
      console.log('ID do usuario na central: ',user_idCentral)
      console.log('id da central: ',idcentral)
      if (responseCentral === "PARSE") {
        return reply.status(200).send({ task: "PARSE", resp: 'usuario ja cadastrado na central' });
      }
      if (responseCentral === "ERROR" || centralResult.result.success ===false) {
        return reply.status(500).send({ task: "ERROR", resp: 'equipamento não encontrada' });
      }
      const UsuarioIdCentral: UsuarioIdCentralDTO = {
        ...UsuarioDTO,
        user_idCentral,
        idcentral: idcentral.join(','),
      };

      //Teste pra mais de uma central
      // const UsuarioIdCentral: UsuarioIdCentralDTO = {
      //   name: 'erick',
      //   idYD: '2',
      //   password: '548837',
      //   begin_time: '01-06-2025 20:00:00',
      //   end_time: '01-2025 20:01:00',
      //   acessos: ['5'],
      //   bio: 'testede bio',
      //   base64: '/9j/4AA',
      //   user_idCentral: '178',
      //   idcentral: '3'
      // }
      const service = new UsuarioServices();
      const exists = await service.findByIdYD(UsuarioDTO.idYD);
      
      if (!exists ) {
        const usuario = await service.createUserAcess(UsuarioIdCentral);
        await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createbiometria", process: "criação de biometria", description: "sucess", });;
        return reply.status(200).send({ task: "SUCESS", resp: usuario });
      }
      const usuarios = await service.adicionarAcesso(UsuarioIdCentral);
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createbiometria", process: "criação de biometria", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuarios });

    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createbiometria", process: "criação de biometria", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'falha ao cadastar' });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    try {
      const service = new UsuarioServices();
      const usuario = await service.list();

      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "list", process: "listar usuarios", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: usuario });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "list", process: "listar usuarios", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'erro ao listar' });
    }
  }
  async listId(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    const { idYD } = request.params as { idYD: string };
    if (!idYD) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }
    try {
      const service = new UsuarioServices();
      const usuario = await service.findByIdYD(idYD);
      if (!usuario) {
        return reply.status(404).send({ resp: "Cliente não encontrado(a)" });
      }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listId", process: "listar usuario por id", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuario });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listId", process: "listar usuario por id", description: "error", });;
      return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
    }
  }
  async listusersequipamento(request: FastifyRequest, reply: FastifyReply) {
     const ipusuario = request.ip
    const { equipamento } = request.params as { equipamento: string }

    if (!equipamento || typeof equipamento !== "string" || equipamento.trim() === "") {
      return reply.status(400).send({ task: "ERROR", resp: 'Preencher Id do equipamento' });
    }
    try {
      const service = new UsuarioServices();

      const usuariosnoequipamento =  await service.findUsersByEquipamento(equipamento)

      if (!usuariosnoequipamento) {
        return reply.status(404).send({ resp: "Cliente não encontrado(a)" });
      }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuariosnoequipamento });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "error", });;
      return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
    }
  }
  async listuserslocais(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip
   const { central } = request.params as { central: string }
   if (!central || typeof central !== "string" || central.trim() === "") {
     return reply.status(400).send({ task: "ERROR", resp: 'Preencher Id do equipamento' });
   }
   try {
     const service = new UsuarioServices();

     //const central = '22'
     const usuarioncentral =  await service.findCentralUsers(central)

     if (!usuarioncentral) {
       return reply.status(404).send({ resp: "Cliente não encontrado(a)" });
     }
     await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "sucess", });;
     return reply.status(200).send({ task: "SUCESS", resp: usuarioncentral });
   } catch (error: any) {
     await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "error", });;
     return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
   }
 }
  async update(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const Usuario = request.body as UsuarioDTO;

    if (!Usuario.name || !Usuario.idYD || !Usuario.password || !Usuario.begin_time || !Usuario.end_time || !Usuario.acessos) {
      return reply.status(400).send({ task: "ERROR", resp: 'preenhcer todos os campos' });
    }
    try {
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(Usuario, ipusuario, "PUT");

      const user_idCentral = centralResult.result.user_idDevice?.toString()
      const responseCentral = centralResult.result.tasks.toString()
      const idcentral = centralResult.idacessos
      const UsuarioIdCentral: UsuarioIdCentralDTO = {
        ...Usuario,
        
        idcentral: idcentral.join(','),
      };
      if (responseCentral === "ERROR") {
        return reply.status(500).send({ task: "ERROR", resp: 'equipamento não encontrada' });
      }
      const service = new UsuarioServices();
      const usuarios = await service.atualizarAcessoEspecifico(UsuarioIdCentral);

      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "update", process: "atualizar usuario", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: usuarios });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "update", process: "atualizar usuario", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'cliente ou acesso não encontrado' });
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const { idYD, acessos } = request.body as UsuarioDTO;
    if (!idYD) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }

    try {
      const payload = {
        idYD: idYD,
        acessos: acessos,
        name: "", // Provide a default or fetch the actual value
        password: "", // Provide a default or fetch the actual value
        begin_time: "", // Provide a default or fetch the actual value
        end_time: ""  // Provide a default or fetch the actual value
      };
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(payload, ipusuario, "DELETE");
      const responseCentral = centralResult.result.tasks.toString()
      if (responseCentral === "ERROR") {
        return reply.status(200).send({ task: "ERROR", resp: 'equipamento não encontrada' });
      }

      const service = new UsuarioServices();
      const idYDusuario = await service.findByIdYD(idYD);

      if (!idYDusuario) {
        return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
      }
      const usuario = await service.delete(idYD);
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "delete", process: "deletar usuario", description: "sucess", });;
      return reply.status(200).send({
        task: "SUCESS.", resp: usuario
      });

    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "delete", process: "deletar usuario", description: "error", });;
      return reply.status(400).send({ task: "ERROR", resp: 'erro ao deletar cliente' });
    }
  }
}



