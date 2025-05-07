import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { CentralController }  from "../controllers/CentralController";
import { verifyToken } from "../middlewares/verifyToken"; // certifique-se de importar corretamente

export async function centralRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.register(async (versionRoutes) => {
      
      versionRoutes.addHook("onRequest", verifyToken);

      versionRoutes.post("/central", async (request, reply) => {
        return new CentralController().create(request, reply);
      });
      versionRoutes.get("/central", async (request, reply) => {
        return new CentralController().list(request, reply);
      });
      versionRoutes.delete("/central", async (request, reply) => {
        return new CentralController().delete(request, reply);
      });
      versionRoutes.put("/central", async (request, reply) => {
        return new CentralController().update(request, reply);
      });
    },
    { prefix: "/api/v1" });
  }