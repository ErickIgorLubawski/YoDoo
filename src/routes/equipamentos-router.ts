import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { EquipamentoController } from "../controllers/EquipamentoController";
import { verifyToken } from "../middlewares/verifyToken";

export async function equipamentoRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const controller = new EquipamentoController();

  // 🔐 Rotas protegidas com middleware
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", verifyToken);

    privateRoutes.get("/equipamentos/centrais", controller.create.bind(controller));   //Verifica na central(params) e cria
    privateRoutes.get("/equipamentos", controller.listEquipamentos.bind(controller));  //atualiza status + ID
    privateRoutes.get("/equipamentosdb", controller.list.bind(controller));            //puxa do banco 
    privateRoutes.delete("/equipamento", controller.delete.bind(controller));
    privateRoutes.put("/equipamento", controller.update.bind(controller));
  });
}

