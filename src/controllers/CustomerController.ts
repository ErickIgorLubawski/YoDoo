// src/controllers/CentralController.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { CustomerServices } from "../services/CustomerServices";
import { CustomerUpdateDTO } from "../DTOs/CustomerDTO";
import { CustomerBiometriaDTO } from "../DTOs/CustomerDTO";

export class CustomerController {

  async createBiometria(request: FastifyRequest, reply: FastifyReply) {

    
    const { name, idYD, password, begin_time, end_time, acessos, bio, base64  } = request.body as CustomerBiometriaDTO;
    if (!name || !idYD || !password || !begin_time || !end_time || !acessos || !bio || !base64) {
      return reply.status(400).send({ error: "Campos obrigatórios: name, idYD, password, begin_time, end_time, acessos, bio, base64  " });
    }
      try {
        const service = new CustomerServices();
        const exists = await service.findByIdYD(idYD);

        if (exists) {
          return reply.status(409).send({ error: "Esse cliente ja existe." });
        }

        const customer = await service.createbiometria({ name, idYD, password, begin_time, end_time, acessos, bio, base64  });
        return reply.status(200).send({message: "SUCESS.",data: customer});

      } catch (error: any) {
      return reply.status(500).send({ error: error.message || "Erro interno do servidor" });
    }
  }
  async createCustomer(request: FastifyRequest, reply: FastifyReply) {


    const { name, idYD, password, begin_time, end_time, bio  } = request.body as CustomerBiometriaDTO;
    if (!name || !idYD || !password || !begin_time || !end_time || ! bio ) {
      return reply.status(400).send({ error: "Campos obrigatórios: name, idYD, password, begin_time, end_time, bio, " });
    }
      try {
        const service = new CustomerServices();
        const createcustomer = await service.findByIdYD(idYD);
        
        console.log(createcustomer);

        if (createcustomer) {
          return reply.status(200).send({ message: "Esse cliente ja existe." + createcustomer });
        }
        console.log(createcustomer);
        //const customer = await service.createcustomer({ name, idYD, password, begin_time, end_time , bio });
        //return reply.status(200).send({message: "Centrais encontradas com sucesso.",data: customer});

      } catch (error: any) {
      //return reply.status(500).send({ error: error.message || "Erro interno do servidor" });
    }

    return reply.status(200).send({message: "Qual validação com esse endPoint?."});
  }
  async list(request: FastifyRequest, reply: FastifyReply) {

    try {
        const service = new CustomerServices();
        const customer = await service.list();

        return reply.status(200).send({message: "SUCESS.", data: customer});

      } catch (error: any) {
      return reply.status(500).send({error: error.message || "Erro ao listar clientes."
      });
    }
  }
  async listId(request: FastifyRequest, reply: FastifyReply) {

    const { idYD } = request.params as { idYD: string };
    console.log(idYD);
      if (!idYD) {
        return reply.status(400).send({error: "ID é obrigatório"});
      }
      try {
        const service = new CustomerServices();
        const customer = await service.findByIdYD(idYD);
        console.log(customer);
        return reply.status(200).send({ message: "SUCESS.", data: customer});

      } catch (error: any) {
        return reply.status(404).send({ error: error.message || "Cliente não encontrado(a)"});
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id, name, idYD, password, begin_time, end_time, acessos, bio, base64 } = request.body as CustomerUpdateDTO;

    if ( id! || !name || !idYD || !password || !begin_time || !end_time || !acessos || !bio || !base64) {
      return reply.status(400).send({ error: "Campos obrigatórios: id, ipCentralMRD, nomeEdificio e numero" });
    }

    try {
      const service = new CustomerServices();
      const customer = await service.update({ id, name, idYD, password, begin_time, end_time, acessos, bio, base64 });

      return reply.status(200).send({ message: "SUCESS.", data: customer});

    } catch (error: any) {
      return reply.status(404).send({ error: error.message || "Cliente não encontrada"});
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
   
    const { id } = request.body as { id: string };

    if (!id) {
      return reply.status(400).send({error: "ID é obrigatório"});
    }

    try {
      const service = new CustomerServices();
      const idcustomer = await service.findByIdYD(id);
      
        if (!idcustomer) {
          return reply.status(404).send({error: "Cliente não encontrada"});
        }
      const customer = await service.delete(id);

      return reply.status(200).send({message: "Cliente deletada com sucesso.",  data: customer
      });
      
    } catch (error: any) {
      return reply.status(400).send({error: error.message || "Erro ao deletar cliente."});
    }
  }
}
