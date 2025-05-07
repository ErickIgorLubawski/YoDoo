import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply  } from "fastify";
import { EquipamentoController } from "../controllers/EquipamentoController";
import { verifyToken } from "../middlewares/verifyToken"; // certifique-se de importar corretamente

export async function equipamentoRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.register(async (versionRoutes) => {
      
      versionRoutes.addHook("onRequest", verifyToken);
      
      versionRoutes.post("/equipamento", async (request, reply) => {
        return new EquipamentoController().create(request, reply);
      });
      versionRoutes.get("/equipamento", async (request, reply) => {
        return new EquipamentoController().list(request, reply);
      });
      versionRoutes.get("/equipamento/:idYD", async (request, reply) => {
        return new EquipamentoController().getByDeviceId(request, reply);
      });
      versionRoutes.delete("/equipamento", async (request, reply) => {
        return new EquipamentoController().delete(request, reply);
      });
      versionRoutes.put("/equipamento", async (request, reply) => {
        return new EquipamentoController().update(request, reply);
      });
    },
    { prefix: "/api/v1" });
  }