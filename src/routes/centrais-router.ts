import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CentralController } from "../controllers/CentralController";
import { verifyToken } from "../middlewares/verifyToken";

export async function centralRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const controller = new CentralController();

  // 🔐 Rotas privadas protegidas por token
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", verifyToken);

    privateRoutes.post("/central", controller.create.bind(controller));
    privateRoutes.get("/central", controller.list.bind(controller));
    privateRoutes.delete("/central", controller.delete.bind(controller));
    privateRoutes.put("/central", controller.update.bind(controller));
  });
}