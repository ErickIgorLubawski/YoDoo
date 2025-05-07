import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply  } from "fastify";
import { CustomerController } from "../controllers/CustomerController";
import { verifyToken } from "../middlewares/verifyToken"; // certifique-se de importar corretamente

export async function customerRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.register(async (versionRoutes) => {
      
      versionRoutes.addHook("onRequest", verifyToken);

      versionRoutes.post("/customer/biometria", async (request, reply) => {
        return new CustomerController().createBiometria(request, reply);
      });
      versionRoutes.post("/customer", async (request, reply) => {
        return new CustomerController().createCustomer(request, reply);
      });
      versionRoutes.get("/customer", async (request, reply) => {
        return new CustomerController().list(request, reply);
      });
      versionRoutes.get("/customer/:idYD", async (request, reply) => {
        return new CustomerController().listId(request, reply);
      });
      versionRoutes.delete("/customer", async (request, reply) => {
        return new CustomerController().delete(request, reply);
      });
      versionRoutes.put("/customer", async (request, reply) => {
        return new CustomerController().update(request, reply);
      });
    },
    { prefix: "/api/v1" }
  );
  }
  