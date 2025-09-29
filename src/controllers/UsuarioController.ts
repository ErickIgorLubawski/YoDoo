import { UsuarioDTO, UsuarioIdCentralDTO, UsuarioAdm } from './../DTOs/UsuarioDTO';
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from 'jsonwebtoken';
import { UsuarioServices } from "../services/UsuarioServices";
import { logExecution } from "../utils/logger";
import { RequestCentral } from "./ResquestUsuarios";
import { UpdateTriggerService } from '../services/UpdateTriggerService';
import { EquipamentoServices } from '../services/EquipamentoServices';
import { CentralServices } from '../services/CentralServices';
import axios from 'axios';

interface UsuarioToken {
  UsuarioAdminToken: string;
  SenhaToken: string;
}

export class UsuarioController {

  private updateTriggerService = new UpdateTriggerService(); 
  async login(request: FastifyRequest, reply: FastifyReply) {

    this.updateTriggerService.checkAndTriggerUpdate();


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
    const ipusuario = request.ip;
    const UsuarioDTO = request.body as UsuarioDTO;
  
    if (
      !UsuarioDTO.name ||
      !UsuarioDTO.idYD ||
      !UsuarioDTO.password ||
      !UsuarioDTO.begin_time ||
      !UsuarioDTO.end_time ||
      !UsuarioDTO.acessos
    ) {
      return reply.status(400).send({ task: "ERROR", resp: "campos não preenchidos" });
    }
    if (!isValidDateTime(UsuarioDTO.begin_time) || !isValidDateTime(UsuarioDTO.end_time)) {
      return reply.status(400).send({ 
        task: "ERROR", 
        resp: "Data inválida ou inexistente." 
      });
    }
    try {
      const serviceCentral = new RequestCentral();
      const equipamentoServices = new EquipamentoServices();
  
      // Verifica se o equipamento existe
      const equipamentos = await equipamentoServices.getIpsAndCentralByDeviceIds(UsuarioDTO.acessos);
      if (!equipamentos || equipamentos.length === 0) {
        return reply.status(404).send({ task: "ERROR", resp: "Equipamento não encontrado" });
      }
  
      let centralResult;
      try {
        // Aqui o try/catch é específico só para a chamada da central
        centralResult = await serviceCentral.processarUsuarioCentral(UsuarioDTO, ipusuario, "POST");
      } catch (error: any) {
        if (error.message?.includes("Timeout")) {
          await logExecution({
            ip: ipusuario,
            class: "UsuarioController",
            function: "createbiometria",
            process: "Comunicação com central",
            description: `Timeout: ${error.message}`,
          });
          return reply.status(504).send({
            task: "ERROR",
            resp: "Tempo limite excedido ao tentar comunicar com o equipamento.",
          });
        }
        throw error; // relança para cair no catch genérico
      }
  
      //const accessResults = centralResult.result.user_idDevice;
  
      console.log("centralResult", centralResult);
      //console.log("accessResults", accessResults);
  
      let usuarioJaCadastrado = false;
  
      for (const item of centralResult.result.tasks) {
        if (item && item.ERROR && item.ERROR[0]?.status === "cliente ja cadastrado") {
          usuarioJaCadastrado = true;
          break;
        }
      }
  
      if (usuarioJaCadastrado) {
        return reply.status(409).send({ task: "ERROR", resp: "Usuário já cadastrado no equipamento." });
      }
  
      // Procura erros retornados pela central
      const erroCentral = centralResult.result.tasks.find(
        (item: any) => item && item.ERROR
      );

      if (erroCentral) {
        // loga detalhadamente
        console.error("❌ Erro retornado pela central:", erroCentral);

        return reply.status(400).send({
          task: "ERROR",
          resp: erroCentral.ERROR, // devolve exatamente o array de erros
        });
      }
  
      const idcentral = centralResult.idacessos;
  
      const UsuarioIdCentral: UsuarioIdCentralDTO = {
        ...UsuarioDTO,
        idcentral,
      };
      console.log("📌 [Controller] UsuarioIdCentral recebido:", JSON.stringify(UsuarioIdCentral, null, 2));
  
      const service = new UsuarioServices();
      const exists = await service.findByIdYD(UsuarioDTO.idYD);
  
      if (!exists) {
        const usuario = await service.createUserAcess(UsuarioIdCentral);
        await logExecution({
          ip: ipusuario,
          class: "UsuarioController",
          function: "createbiometria",
          process: "criação de novo acesso ok",
          description: "sucess",
        });
        return reply.status(200).send({
          task: "SUCESS",
          resp: "criação de usuario ok",
          usuario,
        });
      }
  
      const usuarios = await service.adicionarAcesso(UsuarioIdCentral);
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "createbiometria",
        process: "criação de biometria",
        description: "sucess",
      });
      return reply.status(200).send({
        task: "SUCESS",
        resp: "criação de novo acesso ok",
        usuarios,
      });
  
    } catch (error: any) {
      // Catch genérico (qualquer erro que não seja timeout já tratado)
      console.error("Erro inesperado:", error);
  
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "createbiometria",
        process: "Erro inesperado",
        description: error.message ?? "Erro desconhecido",
      });
  
      return reply.status(500).send({
        task: "ERROR",
        resp: "Erro interno no servidor.",
      });
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
        return reply.status(200).send({ task: "SUCESS", resp: usuario });
      }
      const usuarioid = await service.getById(idyd);
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "getById", process: "listar usuarios por id", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuarioid });


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
      console.log(usuariosnoequipamento)
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
      if (!usuarioncentral) {
         return reply.status(404).send({ resp: "Nenhum cliente nessa central" });
       }
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "sucess", });;
      return reply.status(200).send({ task: "SUCESS", resp: usuarioncentral });
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "listusers", process: "listar usuario no equipamento", description: "error", });;
      return reply.status(404).send({ task: "ERROR", resp: 'central não encontrado' });
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip;
    const Usuario = request.body as UsuarioDTO;
  
    if (!Usuario.idYD || !Usuario.acessos || Usuario.acessos.length === 0) {
      return reply.status(400).send({ task: "ERROR", resp: "preencher idYD e pelo menos um acesso" });
    }
    
    if (Usuario.begin_time) {
      if (!isValidDateTime(Usuario.begin_time)) {
        return reply.status(400).send({
          task: "ERROR",
          resp: "Data inválida ou inexistente."
        });
      } 
    }
    if (Usuario.end_time) {
      if (!isValidDateTime(Usuario.end_time)) {
        return reply.status(400).send({
          task: "ERROR",
          resp: "Data inválida ou inexistente."
        });
      } 
    }
  
    try {
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(Usuario, ipusuario, "PUT");
  
      const UsuarioIdCentral: UsuarioIdCentralDTO = {
        ...Usuario,
        idcentral: centralResult.idacessos, // sempre 1 central nesse fluxo
      };

      //Adicionado Amauri 22/09
      const erroCentral = centralResult.result.tasks.find(
        (item: any) => item && item.ERROR
      );
      
      if (erroCentral) {
        // loga detalhadamente
        console.error("❌ Erro retornado pela central:", erroCentral);

        return reply.status(400).send({
          task: "ERROR",
          resp: erroCentral.ERROR, // devolve exatamente o array de erros
        });
      }
      //^^^^ Adicionado Amauri 22/09

      //VVV BD VVVV
      const service = new UsuarioServices();
      const usuarios = await service.atualizarAcessoEspecifico(UsuarioIdCentral);
  
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "update",
        process: "atualizar usuario",
        description: "sucess",
      });
  
      return reply.status(200).send({ task: "SUCESS", resp: usuarios });
    } catch (error: any) {
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "update",
        process: "atualizar usuario",
        description: "error",
      });
  
      return reply.status(500).send({ task: "ERROR", resp: "cliente ou acesso não encontrado" });
    }
  }
  
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip;
    const { idYD, acessos } = request.body as UsuarioDTO;
  
    if (!idYD) {
      return reply.status(400).send({ resp: "ID é obrigatório" });
    }
  
    try {
      const payload = {
        idYD,
        acessos,
        name: "",
        password: "",
        begin_time: "",
        end_time: ""
      };
  
      const serviceCentral = new RequestCentral();
      const centralResult = await serviceCentral.processarUsuarioCentral(payload, ipusuario, "DELETE");
  
      const responseCentral = centralResult.result.tasks.toString();
  
      console.log('central ',centralResult)
      console.log('responseCentral ',responseCentral)

      if (responseCentral === "ERROR") {
        return reply.status(200).send({ task: "ERROR", resp: "equipamento não encontrado" });
      }
  
      const service = new UsuarioServices();
      const idYDusuario = await service.findByIdYD(idYD);
  
      if (!idYDusuario) {
        return reply.status(404).send({ task: "ERROR", resp: "cliente não encontrado" });
      }
  
      let usuario;
      if (acessos && acessos.length > 0) {
        // apagar apenas os acessos
        usuario = await service.deleteAcessos(idYD, acessos);
      } else {
        // apagar o usuário inteiro
        usuario = await service.delete(idYD);
      }
  
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "delete",
        process: "deletar usuario",
        description: "sucess",
      });
  
      return reply.status(200).send({ task: "SUCESS", resp: usuario });
  
    } catch (error: any) {
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "delete",
        process: "deletar usuario",
        description: "error",
      });
  
      return reply.status(400).send({ task: "ERROR", resp: "erro ao deletar cliente" });
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
  async findByName(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip;
    const { name } = request.query as { name: string };
  
    // Validação do parâmetro de busca
    if (!name || name.trim().length < 2) { // Exige pelo menos 2 caracteres para a busca
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "findByName", process: "Validação de entrada", description: "Parâmetro 'name' ausente ou muito curto.", });
      return reply.status(400).send({ task: "ERROR", resp: 'É necessário fornecer um termo de busca com pelo menos 2 caracteres.' });
    }
  
    try {
      const service = new UsuarioServices();
      const usuarios = await service.findByName(name);
  
      if (usuarios.length === 0) {
        await logExecution({ ip: ipusuario, class: "UsuarioController", function: "findByName", process: "Busca por nome", description: `Nenhum usuário encontrado com o termo: '${name}'`, });
        return reply.status(404).send({ task: "SUCESS", resp: [] }); // Retorna 200 com array vazio ou 404
      }
  
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "findByName", process: "Busca por nome", description: `Busca por '${name}' realizada com sucesso.`, });
      return reply.status(200).send({ task: "SUCESS.", resp: usuarios });
  
    } catch (error: any) {
      await logExecution({ ip: ipusuario, class: "UsuarioController", function: "findByName", process: "Busca por nome", description: `Erro ao buscar usuários: ${error.message}`, });
      return reply.status(500).send({ task: "ERROR", resp: 'Erro interno ao buscar usuários.' });
    }
  }
  async triggerStatusUpdate(request: FastifyRequest, reply: FastifyReply) {
    console.log('[API] Requisição para atualizar status recebida.');
    
    try {
      // Instancia e chama o serviço de atualização
      const updateTriggerService = new UpdateTriggerService();
      await updateTriggerService.checkAndTriggerUpdate();
      
      return reply.status(200).send({ message: 'Processo de atualização iniciado com sucesso.' });

    } catch (error) {
      console.error('Erro ao acionar a atualização de status:', error);
      return reply.status(500).send({ error: 'Falha ao iniciar o processo de atualização.' });
    }
  }
  async espelhar(request: FastifyRequest, reply: FastifyReply) {
    const ipusuario = request.ip;
    const { eqAntigo, eqNovo } = request.body as { eqAntigo: string; eqNovo: string };
  
    if (!eqAntigo || !eqNovo) {
      return reply.status(400).send({ task: "ERROR", resp: "Informe eqAntigo e eqNovo" });
    }
  
    try {
      const usuarioService = new UsuarioServices();
      const equipamentoService = new EquipamentoServices();
      const centralService = new CentralServices();
  
      // 1) Busca todos os usuários do equipamento antigo
      const usuarios = await usuarioService.findUsersByEquipamento(eqAntigo);
      if (!usuarios || usuarios.length === 0) {
        return reply.status(404).send({ task: "ERROR", resp: "Nenhum usuário encontrado no equipamento antigo" });
      }
  


      // 2) Busca dados do equipamento novo
      const eqNovoData = await equipamentoService.getByDeviceId(eqNovo);
      if (!eqNovoData) {
        return reply.status(404).send({ task: "ERROR", resp: "Equipamento novo não encontrado" });
      }
  
      // 3) Busca IP da central do eqNovo
      const centralNovo = await centralService.getByDeviceIds([eqNovoData.central_id]);
      if (!centralNovo || centralNovo.length === 0 || !centralNovo[0].ip_VPN) {
        return reply.status(404).send({ task: "ERROR", resp: "Central do equipamento novo não encontrada" });
      }
  
      const centralIp = centralNovo[0].ip_VPN;
      const equipamentoIpNovo = eqNovoData.ip;
  
      // 4) Monta a lista de usuários adaptada pro novo equipamento
      const userList = usuarios.map(u => ({
        name: u.name,
        idYD: u.idYD,
        base64: u.base64,
        acessos: [
          {
            central: eqNovoData.central_id,
            equipamento: eqNovo,
            user_idEquipamento: u.idYD,
            begin_time: u.acessos[0]?.begin_time ,
            end_time:   u.acessos[0]?.end_time
          }
        ]
      }));
  
      const payload = {
        acesso: equipamentoIpNovo,
        userList
      };
  
      // 5) Envia a lista para a central via axios
      const resp = await axios.post(`http://${centralIp}/cadListClientes`, payload, {
        timeout: 30000
      });
// 4.1) Atualiza o equipamento antigo para o novo nos usuários
for (const u of usuarios) {
  try {
    // Mapeia os acessos do usuário, substituindo eqAntigo por eqNovo
    const acessosAtualizados = (u.acessos as any[]).map(acesso => {
      if (acesso.equipamento === eqAntigo) {
        return {
          ...acesso,
          equipamento: eqNovo
        };
      }
      return acesso;
    });

    // Atualiza o usuário no banco
    await usuarioService.atualizarUsuarioEAcessos({
      idYD: u.idYD,
      acessos: acessosAtualizados.map(a => a.equipamento),
      idcentral: [eqNovoData.central_id],
      begin_time: acessosAtualizados[0]?.begin_time,
      end_time: acessosAtualizados[0]?.end_time,
      name: u.name,
      base64: u.base64,
      password: u.password
    });
  } catch (error) {
    console.error(`Erro ao atualizar usuário ${u.idYD}:`, error);
  }
}

      // 6) Loga sucesso
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "espelhar",
        process: `Espelhamento ${eqAntigo} -> ${eqNovo}`,
        description: `Status ${resp.status}`
      });
  
      return reply.status(200).send({
        task: "SUCESS",
        resp: resp.data
      });
  
    } catch (error: any) {
      console.error("❌ Erro no espelhamento:", error);
  
      await logExecution({
        ip: ipusuario,
        class: "UsuarioController",
        function: "espelhar",
        process: "Erro no espelhamento",
        description: error.message ?? "Erro desconhecido"
      });
  
      return reply.status(500).send({
        task: "ERROR",
        resp: "Erro ao tentar espelhar usuários"
      });
    }
  }

}
function isValidDateTime(dateTimeStr: string): boolean {
  // Regex simples para garantir formato "DD-MM-YYYY HH:mm:ss"
  const regex = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
  const match = dateTimeStr.match(regex);
  if (!match) return false;

  const [ , dd, mm, yyyy, HH, MM, SS ] = match.map(Number);

  // Checa limites básicos
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  if (HH < 0 || HH > 23) return false;
  if (MM < 0 || MM > 59) return false;
  if (SS < 0 || SS > 59) return false;

  // Usa objeto Date pra validar dia/mês (ex: fevereiro 30 não existe)
  const date = new Date(yyyy, mm - 1, dd, HH, MM, SS);
  return (
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd &&
    date.getHours() === HH &&
    date.getMinutes() === MM &&
    date.getSeconds() === SS
  );
}
// equipamento 129
// "id": 1321,
// "registration": "05050505",
// "name": "ERICK 05/07",
// "password": "37fffd2d6542e2d2b9f8350c224517b194fdf827f00aa775b9af29567bb86578",
// "salt": "AauJDG;ZNm)`rnm5#\\aS3Hucx&Dw_hk.",
// "expires": 0,
// "user_type_id": 0,
// "begin_time": 1753822801,
// "end_time": 1767128399,
// "image_timestamp": 1751739010,
// "last_access": 0
// }
// ]


// equipamento 23
// "id": 25,
// "registration": "05050505",
// "name": "ERICK 05/07",
// "password": "1b6a7787101dd535aad31bb4588cbbaf4987957f270e1a3e1c5b58c60f737de0",
// "salt": "GqlS.F+Y)8O5Y2a{BNC,2@a^\\^.&o:WX",
// "expires": 0,
// "user_type_id": 0,
// "begin_time": 1753131601,
// "end_time":   1766437199,
// "begin_time": 1753131601,
// "end_time": 1766437199,
// "image_timestamp": 1751739009,
// "last_access": 0
// }
