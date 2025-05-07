import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { UserController } from '../controllers/UserController';

export async function usuarioRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.register(async (versionRoutes) => {

      versionRoutes.post('/usuarios/token', async (request, reply) => {
        return new UserController().login(request, reply);
      });
    },
{ prefix: "/api/v1" });
}