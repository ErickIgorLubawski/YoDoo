import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { verifyToken } from "../middlewares/verifyToken";
import { UsuarioController } from "../controllers/UsuarioController";


export async function usuarioRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const controller = new UsuarioController();

  // 🔓 Rotas públicas
  fastify.post('/usuarios/token', controller.login.bind(controller));
  // 🔐 Grupo de rotas protegidas com middleware
  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", verifyToken);

    privateRoutes.post("/usuarios/biometria", controller.createBiometria.bind(controller));
    privateRoutes.get("/usuarios", controller.list.bind(controller));
    privateRoutes.put("/usuarios", controller.update.bind(controller));
    privateRoutes.delete("/usuarios", controller.delete.bind(controller));
   
    privateRoutes.get("/usuarioslocal", controller.listuserslocais.bind(controller));
    privateRoutes.get("/usuarios/central", controller.listusersequipamento.bind(controller));
   // privateRoutes.get("/usuarios", controller.list.bind(controller));

  });
}
