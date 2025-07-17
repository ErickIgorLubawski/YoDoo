// src/services/StatusUpdateService.ts

import { PrismaClient } from '@prisma/client'; // <-- 1. ADICIONADO AQUI
import { logExecution } from '../utils/logger';
import { RequestEquipamento } from '../controllers/RequestEquipamento';

const prisma = new PrismaClient(); // <-- 2. ADICIONADO AQUI

export class StatusUpdateService {
  private requestEquipamento = new RequestEquipamento();

  public async runUpdate(): Promise<void> {
    logExecution({ip: 'SERVER_TRIGGER',class: 'StatusUpdateService',function: 'runUpdate',process: 'Início da atualização',description: 'Iniciando verificação de status de centrais e equipamentos.'
    });

    try {
      await this.updateCentraisStatus();
      await this.updateEquipamentosStatus();
      logExecution({ip: 'SERVER_TRIGGER',class: 'StatusUpdateService',function: 'runUpdate',process: 'Fim da atualização',description: 'Atualização de status concluída com sucesso.'});
    } catch (error: any) {
      logExecution({ip: 'SERVER_TRIGGER',class: 'StatusUpdateService', function: 'runUpdate',process: 'Erro na atualização',description: `Falha durante a atualização de status: ${error.message}`
      });
    }
  }

  private async updateCentraisStatus() {
    const centrais = await prisma.centrais.findMany({ select: { id: true, ip_VPN: true }});
    console.log('centrais do banco',centrais)
    const updatePromises = centrais.map(async (central) => {
      const ipToTest =  central.ip_VPN;
      console.log(`Verificando status da central ${central.id} com IP: ${ipToTest}`);
      if (!ipToTest) return;
      const status = await this.requestEquipamento.Status(ipToTest);
      console.log(`1 Atualizando central ${central.id} com status: ${status}`);
      await prisma.centrais.update({ where: { id: central.id }, data: { status: status } });
       // Deixei explícito para clareza
    });
    await Promise.allSettled(updatePromises);
  }

  private async updateEquipamentosStatus() {
    // 1. Buscar todas as CENTRAIS, pois a requisição é por central.
    const centrais = await prisma.centrais.findMany({
      select: { id: true, ip_VPN: true }
    });

    // 2. Criar uma lista de promessas para todas as atualizações de todas as centrais.
    const allPromises = [];

    for (const central of centrais) {

      console.log('centrais do banco: ',central)

      const ipCentral = central.ip_VPN;
      if (!ipCentral) continue; // Pula para a próxima central se não houver IP

      // 3. Fazer UMA ÚNICA requisição por central para obter o status de TODOS os seus equipamentos.
      const statusList = await this.requestEquipamento.getBulkEquipamentoStatus(ipCentral);

      console.log('statusList: ', statusList);

      // 4. Se a resposta for válida (não nula e com itens), processar a lista de status.
      if (statusList && statusList.length > 0) {
        logExecution({ip: 'SERVER', class: 'StatusUpdateService', function: 'updateEquipamentosStatus',process: `Processando ${statusList.length} equipamentos da central ${central.id}`,description: `Requisição para ${ipCentral} bem-sucedida.`
        });
        
        for (const equipamentoStatus of statusList) {
          // 5. Para cada item da lista, criar uma promessa de atualização no banco
          //    usando o IP do equipamento para encontrá-lo.
          const updatePromise = prisma.equipamentos.updateMany({
            where: {
              ip: equipamentoStatus.ip,
              // Opcional: garantir que o equipamento pertence à central correta.
              // central_id: central.id 
            },
            data: {
              status: equipamentoStatus.status,
            },
          });
          allPromises.push(updatePromise);
        }
      }
    }

    // 6. Aguardar a conclusão de TODAS as promessas de atualização de todos os equipamentos.
    await Promise.allSettled(allPromises);
  }
}