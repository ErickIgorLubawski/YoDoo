// src/controllers/CentralController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from 'jsonwebtoken';
import { UsuarioServices } from "../services/UsuarioServices";
import { UsuarioDTO} from "../DTOs/UsuarioDTO";


interface UsuarioToken {
  UsuarioAdminToken: string;
  SenhaToken: string;
}
export class UsuarioController {

  usuarioLocal: UsuarioToken = {UsuarioAdminToken: 'Youdoo_MRD' ,SenhaToken: '587469',};

  async login(request: FastifyRequest, reply: FastifyReply) {
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

      return reply.status(200).send({ token });
    } catch (error: any) {
      return reply.status(500).send({ resp: error.message || 'Erro interno do servidor.' });
    }
  }
  async createBiometria(request: FastifyRequest, reply: FastifyReply) {

    
    const { name, idYD, password, begin_time, end_time, acessos, bio, base64  } = request.body as UsuarioDTO;
    if (!name || !idYD || !password || !begin_time || !end_time || !acessos) {
      return reply.status(400).send({ resp: "Campos obrigatórios: name, idYD, password, begin_time, end_time, acessos, bio, base64  " });
    }


      try {
        const service = new UsuarioServices();
        const exists = await service.findByIdYD(idYD);

        if (exists) {
          return reply.status(409).send({ resp: "Esse cliente ja existe." });
        }

        const usuario = await service.createbiometria({ name, idYD, password, begin_time, end_time, acessos, bio, base64  });
        return reply.status(200).send({task: "SUCESS",resp: usuario});

      } catch (error: any) {
      return reply.status(500).send({ resp: error.message || "Erro interno do servidor" });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {

    try {
        const service = new UsuarioServices();
        const usuario = await service.list();

        return reply.status(200).send({task: "SUCESS.", resp: usuario});

      } catch (error: any) {
      return reply.status(500).send({resp: error.message || "Erro ao listar clientes."
      });
    }
  }
  async listId(request: FastifyRequest, reply: FastifyReply) {

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
        return reply.status(200).send({ task: "SUCESS", resp: usuario});

      } catch (error: any) {
        console.log(error);
        return reply.status(404).send({ resp: "Cliente não encontrado(a)"});
    }
  }
  async listusers(request: FastifyRequest, reply: FastifyReply) {

    const { acessos } = request.body as { acessos: string };
    console.log(acessos);
    if (!acessos || typeof acessos !== "string" || acessos.trim() === "") {
      return reply.status(400).send({ resp: "Campo 'acesso' é obrigatório e deve ser uma string não vazia." });
    }
      try {
        const service = new UsuarioServices();
        const usuarioacessos = await service.findByAcesso(acessos);
        if(!usuarioacessos) {
          return reply.status(404).send({resp: "Cliente não encontrado(a)"});
        }
        return reply.status(200).send({ task: "SUCESS", resp: usuarioacessos});

      } catch (error: any) {
        console.log(error);
        return reply.status(404).send({ resp: "Cliente não encontrado(a)"});
    }
  }


  async  update(request: FastifyRequest, reply: FastifyReply) {
    const { name, idYD, password, begin_time, end_time, acessos, bio, base64 } = request.body as UsuarioDTO;

    if ( !name || !idYD || !password || !begin_time || !end_time || !acessos ) {
      return reply.status(400).send({ resp: "Campos obrigatórios: id, ipCentralMRD, nomeEdificio e numero" });
    }

    try {
      const service = new UsuarioServices();
      const usuario = await service.update({ name, idYD, password, begin_time, end_time, acessos, bio, base64 });

      return reply.status(200).send({ task: "SUCESS.", resp: usuario});

    } catch (error: any) {
      return reply.status(404).send({ resp: "Cliente não encontrada"});
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
   
    const { idYD } = request.body as { idYD: string };

    if (!idYD) {
      return reply.status(400).send({resp: "ID é obrigatório"});
    }

    try {
      const service = new UsuarioServices();
      const idYDusuario = await service.findByIdYD(idYD);
      
        if (!idYDusuario) {
          return reply.status(404).send({resp: "Cliente não encontrada"});
        }
      const usuario = await service.delete(idYD);

      return reply.status(200).send({task: "SUCESS.",  resp: usuario
      });
      
    } catch (error: any) {
      return reply.status(400).send({resp: "Erro ao deletar cliente."});
    }
  }
}
