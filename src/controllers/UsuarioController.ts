import { UsuarioDTO, UsuarioIdCentralDTO, UsuarioAdm } from './../DTOs/UsuarioDTO';
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from 'jsonwebtoken';
import { UsuarioServices } from "../services/UsuarioServices";
import { logExecution } from "../utils/logger";
import { RequestCentral } from "./ResquestUsuarios";

interface UsuarioToken {
  UsuarioAdminToken: string;
  SenhaToken: string;
}
export class UsuarioController {

  async login(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip; // Captura o IP para logging
    console.log('IP do usuário:', ipusuario);
    // 1 - Valide o que está recebendo, com retorno
    // Utilizando desestruturação e renomeando para clareza
    const { usuario, senha } = request.body as UsuarioAdm; 
    if (!usuario || typeof usuario !== 'string' || usuario.trim() === '') {
      logExecution({ ip: ipusuario, class: "UsuarioController",function: "login",process: "Validação de entrada", description: "Campo 'name' é obrigatório e deve ser uma string não vazia.",});
      return reply.status(400).send({ task: "ERROR", resp: 'O nome de usuário é obrigatório.' });
    }
    if (!senha || typeof senha !== 'string' || senha.trim() === '') {
      logExecution({
        ip: ipusuario,class: "UsuarioController",function: "login",process: "Validação de entrada",description: "Campo 'senha' é obrigatório e deve ser uma string não vazia."});
      return reply.status(400).send({ task: "ERROR", resp: 'A senha é obrigatória.' });
    }
    // Log da tentativa de login
    logExecution({ip: ipusuario,class: "UsuarioController",function: "login",process: "Processo de Autenticação",description: `Tentativa de login para o usuário: ${usuario}`, });
    try {
      const service = new UsuarioServices();
      console.log('adm',usuario, senha)
      // 2 - Pesquise o usuário e senha no banco & 3 - Faça a comparação de dados
      // A lógica de busca e comparação é encapsulada no serviço.
      // O serviço retorna o usuário autenticado (sem a senha) ou null se as credenciais forem inválidas.

      const authenticatedUser = await service.validateAdmCredentials(usuario, senha);
      console.log('autenticado', authenticatedUser)
      if (!authenticatedUser) {
        // Credenciais inválidas (usuário não encontrado ou senha incorreta)
        logExecution({ ip: ipusuario, class: "UsuarioController",function: "login",process: "Processo de Autenticação",description: `Falha de autenticação para o usuário: ${usuario}. Credenciais inválidas.`,   });
        return reply.status(401).send({ task: "ERROR", resp: 'Nome de usuário ou senha inválidos.' });
      }

      // 4 - Se erro retorna se não gera e retorna token
      // Verifica se a chave secreta JWT está definida
      const secret = process.env.JWT_SECRET as string;
      if (!secret) {
        logExecution({ip: ipusuario, class: "UsuarioController",function: "login", process: "Configuração JWT",description: "Variável de ambiente JWT_SECRET não definida.",});
        return reply.status(500).send({ task: "ERROR", resp: 'Erro de configuração do servidor: chave secreta JWT não encontrada.' });
      }

      // Gera o token JWT com informações relevantes (ID e nome do usuário, sem a senha)
      const token = jwt.sign(
        { id: authenticatedUser.id, usuario: authenticatedUser.usuario },
        secret,
        { expiresIn: '1d' } // Token expira em 1 dia
      );

      // 5 - Com retorno e status do fastify bem compreensível de entender.
      logExecution({ip: ipusuario,class: "UsuarioController",function: "login",process: "Processo de Autenticação",   description: `Login bem-sucedido para o usuário: ${usuario}.`,});
      return reply.status(200).send({ token: token });

    } catch (error: any) {
      // Captura e loga qualquer erro inesperado durante o processo
      logExecution({ip: ipusuario,class: "UsuarioController",function: "login",process: "Processo de Autenticação",description: `Erro inesperado durante o login para o usuário ${usuario}: ${error.message}`});
      // Retorna um erro genérico para o cliente, evitando vazar informações internas
      return reply.status(500).send({ task: "ERROR", resp: 'Erro interno do servidor durante o processo de login.' });
    }
  }

  async createBiometria(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const UsuarioDTO = request.body as UsuarioDTO;

    if (!UsuarioDTO.name || !UsuarioDTO.idYD || !UsuarioDTO.password || !UsuarioDTO.begin_time || !UsuarioDTO.end_time || !UsuarioDTO.acessos) {
      return reply.status(400).send({ task: "ERROR", resp: 'campos não preenchidos' });
    }
    try {
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(UsuarioDTO, ipusuario, "POST");
      const task = centralResult.result.tasks.toString()
       console.log('resposta da central: ',centralResult)
      // console.log('task da central em request central',task)


      const user_idEquipamento = centralResult.result.user_idDevice?.toString()
      const idcentral = centralResult.idacessos

      // console.log('status resposta da central: ',responseCentral)
      // console.log('ID do usuario na central: ',user_idEquipamento)
      // console.log('id da central: ',idcentral)

      if (task.includes("PARSE")) {
        return reply.status(200).send({ task: "PARSE", resp: 'usuario ja cadastrado no equipamento' });
      }
      if (task.includes("ERROR")) {
        return reply.status(500).send({ task: "ERROR", resp: 'equipamento não encontrada' });
      }
      const UsuarioIdCentral: UsuarioIdCentralDTO = {
        ...UsuarioDTO,
        user_idEquipamento,
        idcentral: idcentral.join(','),
      };

      // Teste pra mais de uma central equipamento
      // const UsuarioIdCentral: UsuarioIdCentralDTO = {
      //   name: 'Erick DEV',
      //   idYD: '10',
      //   password: '548837',
      //   begin_time: '01-06-2025 20:00:00',
      //   end_time: '01-2025 20:01:00',
      //   acessos: ['4408801109345045'],
      //   bio: 'testede bio',
      //   base64: '/9j/4AA',
      //   user_idEquipamento: '178',
      //   idcentral: '1'
      // }
      const service = new UsuarioServices();
      const exists = await service.findByIdYD(UsuarioDTO.idYD);

      if (!exists) {
        const usuario = await service.createUserAcess(UsuarioIdCentral);
        await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createbiometria", process: "criação de novo acesso ok", description: "sucess", });;
        return reply.status(200).send({ task: "SUCESS", resp:"criação de novo acesso ok", usuario });
      }
      const usuarios = await service.adicionarAcesso(UsuarioIdCentral);
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createbiometria", process: "criação de biometria", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp:"criação de novo usuario ok", usuarios });

    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createbiometria", process: "criação de biometria", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'falha ao cadastar' });
    }
  }
  async list(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip
    const service = new UsuarioServices();

    try {
      const { idyd } = request.query as { idyd: string };

      if (!idyd) {
        const usuario = await service.list();
        console.log('usuarios', usuario)
        await logExecution({ ip: ipusuario, class: "UsuarioController", function: "list", process: "listar usuarios", description: "sucess", });;
        return reply.status(200).send({ task: "SUCESS.", resp: usuario });
      }
      const usuarioid = await service.getById(idyd);
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "getById", process: "listar usuarios por id", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: usuarioid });


    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "list", process: "listar usuarios", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'erro ao listar' });
    }
  }
  async listId(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    const { idYD } = request.params as { idYD: string };
    if (!idYD) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }
    try {
      const service = new UsuarioServices();
      const usuario = await service.findByIdYD(idYD);
      if (!usuario) {
        return reply.status(404).send({ resp: "Cliente não encontrado(a)" });
      }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listId", process: "listar usuario por id", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuario });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listId", process: "listar usuario por id", description: "error", });;
      return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
    }
  }
  async listusersequipamento(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip
    const { equipamento } = request.query as { equipamento: string }

    console.log(equipamento)

    if (!equipamento || typeof equipamento !== "string" || equipamento.trim() === "") {
      return reply.status(400).send({ task: "ERROR", resp: 'Preencher Id do equipamento' });
    }
    try {
      const service = new UsuarioServices();

      const usuariosnoequipamento = await service.findUsersByEquipamento(equipamento)

      if (!usuariosnoequipamento) {
        return reply.status(404).send({ resp: "Cliente não encontrado(a)" });
      }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuariosnoequipamento });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "error", });;
      return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
    }
  }
  async listuserslocais(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const { central } = request.query as { central: string }
    if (!central || typeof central !== "string" || central.trim() === "") {
      return reply.status(400).send({ task: "ERROR", resp: 'Preencher Id do equipamento' });
    }
    try {
      const service = new UsuarioServices();

      //const central = '22'
      const usuarioncentral =  await service.findCentralUsers(central)
      //const usuarioncentral = ''
      // if (!usuarioncentral) {
      //   return reply.status(404).send({ resp: "Cliente não encontrado(a)" });
      // }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuarioncentral });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "error", });;
      return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const Usuario = request.body as UsuarioDTO;

    if (!Usuario.name || !Usuario.idYD || !Usuario.password || !Usuario.begin_time || !Usuario.end_time || !Usuario.acessos) {
      return reply.status(400).send({ task: "ERROR", resp: 'preenhcer todos os campos' });
    }
    try {
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(Usuario, ipusuario, "PUT");

      //console.log('usuario no equipamento',centralResult)

     // const user_idEquipamento = centralResult.result.user_idDevice?.toString()
      const task = centralResult.result.tasks.toString()
      const idcentral = centralResult.idacessos
      const UsuarioIdCentral: UsuarioIdCentralDTO = {
        ...Usuario,
        idcentral: idcentral.join(','),
      };

      console.log('payload', UsuarioIdCentral)

      if (task.includes("ERROR")) {
        return reply.status(500).send({ task: "ERROR", resp: 'equipamento não encontrada' });
      }
      const service = new UsuarioServices();
      const usuarios = await service.atualizarAcessoEspecifico(UsuarioIdCentral);
      console.log('usuarios no equipamento', usuarios)
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "update", process: "atualizar usuario", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS.", resp: usuarios });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "update", process: "atualizar usuario", description: "error", });;
      return reply.status(500).send({ task: "ERROR", resp: 'cliente ou acesso não encontrado' });
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {

    const ipusuario = request.ip
    const { idYD, acessos } = request.body as UsuarioDTO;
    if (!idYD) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }

    try {
      const payload = {
        idYD: idYD,
        acessos: acessos,
        name: "", // Provide a default or fetch the actual value
        password: "", // Provide a default or fetch the actual value
        begin_time: "", // Provide a default or fetch the actual value
        end_time: ""  // Provide a default or fetch the actual value
      };
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(payload, ipusuario, "DELETE");
      const responseCentral = centralResult.result.tasks.toString()
      if (responseCentral === "ERROR") {
        return reply.status(200).send({ task: "ERROR", resp: 'equipamento não encontrada' });
      }

      const service = new UsuarioServices();
      const idYDusuario = await service.findByIdYD(idYD);

      if (!idYDusuario) {
        return reply.status(404).send({ task: "ERROR", resp: 'cliente não encontrado' });
      }
      const usuario = await service.delete(idYD);
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "delete", process: "deletar usuario", description: "sucess", });;
      return reply.status(200).send({
        task: "SUCESS.", resp: usuario
      });

    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "delete", process: "deletar usuario", description: "error", });;
      return reply.status(400).send({ task: "ERROR", resp: 'erro ao deletar cliente' });
    }
  }
  async createAdm(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip

    const admData = request.body as UsuarioAdm;
    const { usuario, senha } = admData;
    if (!usuario || !senha) {
      return reply.status(400).send({ resp: "Usuario e senha obrigatorio" });
    }
    try {
      const service = new UsuarioServices();  
      const exists = await service.findnameAdm(usuario);
      if (exists) {
        return reply.status(400).send({ task: "ERROR", resp: 'Usuario ja cadastrado com esse name' });
      }
      const newUsuario = await service.createAdm(admData);
      if (!newUsuario) {
        return reply.status(400).send({ task: "ERROR", resp: 'erro ao cadastrar usuario' });
      }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createAdm", process: "criação de novo adm", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: 'criação de novo adm ok', usuario: newUsuario });
      
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "createAdm", process: "criar usuario adm", description: "error", });;
      return reply.status(400).send({ task: "ERROR", resp: 'erro ao deletar cliente' });
    }
  }
}



