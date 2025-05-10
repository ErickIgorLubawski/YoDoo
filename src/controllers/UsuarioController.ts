// src/controllers/CentralController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from 'jsonwebtoken';
import { UsuarioServices } from "../services/UsuarioServices";
import { UsuarioDTO} from "../DTOs/UsuarioDTO";
import { UsuarioUpdateDTO } from "../DTOs/UsuarioDTO";


interface UsuarioToken {
  UsuarioAdminToken: string;
  SenhaToken: string;
}
export class UsuarioController {

  usuarioLocal: UsuarioToken = {UsuarioAdminToken: 'Youdoo_MRD' ,SenhaToken: '587469',};

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { usuario, senha } = request.body as { usuario: string; senha: string };

    if (!usuario || !senha) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios.' });
    }

    try { 
      if (usuario !== this.usuarioLocal.UsuarioAdminToken) {
        return reply.status(401).send({ error: 'Usuario invalido.' });
      } else if (senha !== this.usuarioLocal.SenhaToken) {
        return reply.status(401).send({ error: 'Senha invalida.' });
      }

      const secret = process.env.JWT_SECRET as string;
      const token = jwt.sign(this.usuarioLocal, secret, {
        expiresIn: '1d',
      });

      return reply.status(200).send({ token });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Erro interno do servidor.' });
    }
  }

  async createBiometria(request: FastifyRequest, reply: FastifyReply) {

    
    const { name, idYD, password, begin_time, end_time, acessos, bio, base64  } = request.body as UsuarioDTO;
    if (!name || !idYD || !password || !begin_time || !end_time || !acessos) {
      return reply.status(400).send({ error: "Campos obrigatórios: name, idYD, password, begin_time, end_time, acessos, bio, base64  " });
    }


      try {
        const service = new UsuarioServices();
        const exists = await service.findByIdYD(idYD);

        if (exists) {
          return reply.status(409).send({ error: "Esse cliente ja existe." });
        }

        const usuario = await service.createbiometria({ name, idYD, password, begin_time, end_time, acessos, bio, base64  });
        return reply.status(200).send({message: "SUCESS.",data: usuario});

      } catch (error: any) {
      return reply.status(500).send({ error: error.message || "Erro interno do servidor" });
    }
  }
  async createUsuario(request: FastifyRequest, reply: FastifyReply) {


    const { name, idYD, password, begin_time, end_time, bio  } = request.body as UsuarioDTO;
    if (!name || !idYD || !password || !begin_time || !end_time || ! bio ) {
      return reply.status(400).send({ error: "Campos obrigatórios: name, idYD, password, begin_time, end_time, bio, " });
    }
      try {
        const service = new UsuarioServices();
        const createusuario = await service.findByIdYD(idYD);
        
        console.log(createusuario);

        if (createusuario) {
          return reply.status(200).send({ message: "Esse cliente ja existe." + createusuario });
        }
        console.log(createusuario);
        //const customer = await service.createcustomer({ name, idYD, password, begin_time, end_time , bio });
        //return reply.status(200).send({message: "Centrais encontradas com sucesso.",data: customer});

      } catch (error: any) {
      //return reply.status(500).send({ error: error.message || "Erro interno do servidor" });
    }

    return reply.status(200).send({message: "Qual validação com esse endPoint?."});
  }
  async list(request: FastifyRequest, reply: FastifyReply) {

    try {
        const service = new UsuarioServices();
        const usuario = await service.list();

        return reply.status(200).send({message: "SUCESS.", data: usuario});

      } catch (error: any) {
      return reply.status(500).send({error: error.message || "Erro ao listar clientes."
      });
    }
  }
  async listId(request: FastifyRequest, reply: FastifyReply) {

    const { idYD } = request.params as { idYD: string };
    console.log(idYD);
      if (!idYD) {
        return reply.status(400).send({error: "ID é obrigatório"});
      }
      try {
        const service = new UsuarioServices();
        const usuario = await service.findByIdYD(idYD);
        console.log(usuario);
        return reply.status(200).send({ message: "SUCESS.", data: usuario});

      } catch (error: any) {
        return reply.status(404).send({ error: error.message || "Cliente não encontrado(a)"});
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id, name, idYD, password, begin_time, end_time, acessos, bio, base64 } = request.body as UsuarioUpdateDTO;

    if ( !name || !idYD || !password || !begin_time || !end_time || !acessos ) {
      return reply.status(400).send({ error: "Campos obrigatórios: id, ipCentralMRD, nomeEdificio e numero" });
    }

    try {
      const service = new UsuarioServices();
      const usuario = await service.update({id, name, idYD, password, begin_time, end_time, acessos, bio, base64 });

      return reply.status(200).send({ message: "SUCESS.", data: usuario});

    } catch (error: any) {
      return reply.status(404).send({ error: error.message || "Cliente não encontrada"});
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
   
    const { id } = request.body as { id: string };

    if (!id) {
      return reply.status(400).send({error: "ID é obrigatório"});
    }

    try {
      const service = new UsuarioServices();
      const idusuario = await service.findByIdYD(id);
      
        if (!idusuario) {
          return reply.status(404).send({error: "Cliente não encontrada"});
        }
      const usuario = await service.delete(id);

      return reply.status(200).send({message: "Cliente deletada com sucesso.",  data: usuario
      });
      
    } catch (error: any) {
      return reply.status(400).send({error: error.message || "Erro ao deletar cliente."});
    }
  }
}
