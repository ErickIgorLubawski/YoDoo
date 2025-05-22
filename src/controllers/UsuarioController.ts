import { UsuarioDTO } from './../DTOs/UsuarioDTO';
// src/controllers/CentralController.ts
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

  usuarioLocal: UsuarioToken = {UsuarioAdminToken: 'Youdoo_MRD' ,SenhaToken: '587469',};

  async login(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

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

      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "list",process: "Solicitação de Token",description: "sucess",});;
      return reply.status(200).send({ token })
      
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "list",process: "Solicitação de Token",description: "error",});;
      return reply.status(500).send({ task: "ERROR",resp: 'erro no servidor' });

    }
  }
  async createBiometria(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    
    const { name, idYD, password, begin_time, end_time, acessos, bio, base64,user_idCentral  } = request.body as UsuarioDTO;
    if (!name || !idYD || !password || !begin_time || !end_time || !acessos) {
      return reply.status(400).send({ task: "ERROR",resp: 'campos não preenchidos' });
    }
    
    try {
          const payload = {
          name:       name,
          idYD:       idYD,
          begin_time: begin_time,
          end_time:   end_time,
          acessos:    acessos,
          password:   password,
          base64:     base64
          };
         const requestCentral = new RequestCentral();
         const responseCentral = await requestCentral.cadastraUsuarioCentral(payload, ipusuario);

         let user_idCentral = responseCentral.user_idDevice;
         console.log('print do user controller',user_idCentral)
          
        //   if (user_idCentral >=0) {
        //    return reply.status(409).send({task: "ERROR",resp: 'erro ao cadastrar na central'});
        //  }
          //se cadastrado pega id da central pra enviar ao banco 
          const service = new UsuarioServices();
          const exists = await service.findByIdYD(idYD);
          
        if (exists) {
          return reply.status(409).send({ task: "ERROR",resp: 'usuario ja existe' });
        }

        const usuario = await service.createbiometria({ name, idYD, password, begin_time, end_time, acessos, bio, base64,user_idCentral  });

        console.log(usuario)

        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "createbiometria", process: "criação de biometria",description: "sucess",});;
        return reply.status(200).send({task: "SUCESS",resp: usuario});

      } catch (error: any) {
        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "createbiometria",process: "criação de biometria",description: "error",});;
      return reply.status(500).send({ task: "ERROR",resp: 'falha ao cadastar' });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    try {
        const service = new UsuarioServices();
        const usuario = await service.list();

        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "list",process: "listar usuarios",description: "sucess",});;
        return reply.status(200).send({task: "SUCESS.", resp: usuario});
      } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "list",process: "listar usuarios",description: "error",});;
      return reply.status(500).send({task: "ERROR",resp: 'erro ao listar'});
    }
  }
  async listId(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    const { idYD } = request.params as { idYD: string };
    console.log(idYD);
      if (!idYD) {
        return reply.status(400).send({resp: "ID é obrigatório"});
      }
      try {
        const service = new UsuarioServices();
        const usuario = await service.findByIdYD(idYD);
        if(!usuario) {
          return reply.status(404).send({resp: "Cliente não encontrado(a)"});
        }
        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "listId",process: "listar usuario por id",description: "sucess",});;
        return reply.status(200).send({ task: "SUCESS", resp: usuario});
      } catch (error: any) {
        console.log(error);
        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "listId",process: "listar usuario por id",description: "error",});;
        return reply.status(404).send({ task: "ERROR",resp: 'cliente não encontrado'});
    }
  }
  async listusers(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    const { acessos } = request.body as { acessos: string };
    console.log(acessos);
    if (!acessos || typeof acessos !== "string" || acessos.trim() === "") {
      return reply.status(400).send({ task: "ERROR",resp: 'campos obrigatorio' });
    }
      try {
        const service = new UsuarioServices();
        const usuarioacessos = await service.findByAcesso(acessos);
        if(!usuarioacessos) {
          return reply.status(404).send({resp: "Cliente não encontrado(a)"});
        }
        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "listusers",process: "listar usuario no equipamento",description: "sucess",});;
        return reply.status(200).send({ task: "SUCESS", resp: usuarioacessos});
      } catch (error: any) {
        await logExecution({ ip: ipusuario, class: "UsuarioController",function: "listusers",process: "listar usuario no equipamento",description: "error",});;
        return reply.status(404).send({ task: "ERROR",resp: 'cliente não encontrado'});
    }
  }
  async  update(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    const { name, idYD, password, begin_time, end_time, acessos, bio, base64 } = request.body as UsuarioDTO;

    if ( !name || !idYD || !password || !begin_time || !end_time || !acessos ) {
      return reply.status(400).send({ task: "ERROR",resp: 'preenhcer todos os campos'});
    }

    try {
      const service = new UsuarioServices();
      const usuario = await service.update({ name, idYD, password, begin_time, end_time, acessos, bio, base64 });

      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "update",process: "atualizar usuario",description: "sucess",});;
      return reply.status(200).send({ task: "SUCESS.", resp: usuario});
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "update",process: "atualizar usuario",description: "error",});;
      return reply.status(404).send({ task: "ERROR",resp: 'cliente não encontrado'});
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip
   
    const { idYD } = request.body as { idYD: string };

    if (!idYD) {
      return reply.status(400).send({resp: "ID é obrigatório"});
    }

    try {
      const service = new UsuarioServices();
      const idYDusuario = await service.findByIdYD(idYD);
      
        if (!idYDusuario) {
          return reply.status(404).send({task: "ERROR",resp: 'cliente não encontrado'});
        }
      const usuario = await service.delete(idYD);
      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "delete",process: "deletar usuario",description: "sucess",});;
      return reply.status(200).send({task: "SUCESS.",  resp: usuario
      });
      
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController",function: "delete",process: "deletar usuario",description: "error",});;
      return reply.status(400).send({task: "ERROR",resp: 'erro ao deletar cliente'});
    }
  }
}
