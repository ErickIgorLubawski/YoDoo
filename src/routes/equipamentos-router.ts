import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { EquipamentoController } from "../controllers/EquipamentoController";
import { verifyToken } from "../middlewares/verifyToken";

export async function equipamentoRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const controller = new EquipamentoController();

  // 🔐 Rotas protegidas com middleware
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", verifyToken);

    privateRoutes.get("/centrais/equipamentos", controller.create.bind(controller));
    privateRoutes.get("/equipamento", controller.list.bind(controller));
    privateRoutes.get("/equipamento/:device_id", controller.getByDeviceId.bind(controller));
    privateRoutes.delete("/equipamento", controller.delete.bind(controller));
    privateRoutes.put("/equipamento", controller.update.bind(controller));
  });
}
