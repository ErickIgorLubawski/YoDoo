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


// {
//   "device_id": "66148242568a44763dcf6a1c",
//    "ip_local": "192.168.0.129",
//    "ip_VPN": "192.168.101.4",
//    "mac": "f0:bf:97:66:89:90",
//    "nomeEdificio": "YD Piquiri",
//    "numero": "390",
//    "rua": "Rua Piquiri",
//    "bairro": "Rebouças",
//    "version": "2.1.0",
//    "createdAt": "2024-04-08T23:48:18.489Z",
//    "updatedAt": "2024-09-18T16:50:02.923Z",
// }