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
    // ---- PASSO 1: CORRIGIR A BUSCA PARA INCLUIR 'device_id' ----
    const centrais = await prisma.centrais.findMany({
      select: { id: true, ip_VPN: true, device_id: true } // << ADICIONADO 'device_id'
    });
  
    const allPromises = [];
  
    for (const central of centrais) {
      console.log('centrais do banco: ', central);
      const ipCentral = central.ip_VPN;
      if (!ipCentral) continue;
  
      const statusList = await this.requestEquipamento.getBulkEquipamentoStatus(ipCentral);
      console.log('statusList: ', statusList);
  
      if (statusList) {
        // Esta parte já estava correta.
        for (const equipamentoStatus of statusList) {
          const updatePromise = prisma.equipamentos.updateMany({
            where: { ip: equipamentoStatus.ip },
            data: { status: equipamentoStatus.status },
          });
          allPromises.push(updatePromise);
        }
      } else {
        // A central está offline.
        console.warn(`Central ${central.id} (Device ID: ${central.device_id}) offline. Marcando seus equipamentos como 'offline'.`);
  
        // ---- PASSO 2: USAR O 'device_id' CORRETO NA ATUALIZAÇÃO ----
        const updateOfflinePromise = prisma.equipamentos.updateMany({
          where: {
            central_id: central.device_id, // << CORRIGIDO de central.id para central.device_id
          },
          data: {
            status: 'offline',
          },
        });
        allPromises.push(updateOfflinePromise);
      }
    }
  
    if (allPromises.length > 0) {
      await Promise.allSettled(allPromises);
      console.log('--- ATUALIZAÇÃO DE STATUS DE EQUIPAMENTOS CONCLUÍDA ---');
    } else {
      console.log('--- NENHUMA ATUALIZAÇÃO DE STATUS DE EQUIPAMENTOS A FAZER ---');
    }
  }
}