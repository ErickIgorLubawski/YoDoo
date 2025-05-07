// controllers/AuthController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

interface UsuarioToken {
  UsuarioAdminToken: string;
  SenhaToken: string;
}

export class UserController {

  usuarioLocal: UsuarioToken = {UsuarioAdminToken: 'Youdoo_MRD' ,SenhaToken: 'Youdoo_@_2025',};

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
}
