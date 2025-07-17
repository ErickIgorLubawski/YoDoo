// src/services/UpdateTriggerService.ts

import { PrismaClient } from '@prisma/client'; // <-- CORREÇÃO: Importado diretamente do @prisma/client
import { logExecution } from '../utils/logger';
import { StatusUpdateService } from './StatusUpdateService';

const prisma = new PrismaClient(); // <-- CORREÇÃO: Instanciado aqui, seguindo seu padrão

//const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
const UPDATE_INTERVAL_MS = 1 * 60 * 1000; // 2 minutos
const CONFIG_KEY = 'lastStatusUpdateTimestamp';

export class UpdateTriggerService {
  private statusUpdateService = new StatusUpdateService();

  public async checkAndTriggerUpdate(): Promise<void> {
    try {
      const lastUpdateConfig = await prisma.systemConfig.findUnique({
        where: { key: CONFIG_KEY },
      });
      console.log('Last update config:', lastUpdateConfig);
      console.log('CONFIG_KEY:', CONFIG_KEY);

      const now = new Date();
      if (!lastUpdateConfig || (now.getTime() - new Date(lastUpdateConfig.value).getTime()) > UPDATE_INTERVAL_MS) {
        
        logExecution({ip: 'SERVER_TRIGGER',class: 'UpdateTriggerService',function: 'checkAndTriggerUpdate',process: 'Gatilho Ativado',description: 'Período de 24h excedido. Disparando atualização em background.',});

        await prisma.systemConfig.upsert({
          where: { key: CONFIG_KEY },
          update: { value: now.toISOString() },
          create: { key: CONFIG_KEY, value: now.toISOString() },
        });

        this.statusUpdateService.runUpdate();
      }
    } catch (error: any) {
        logExecution({ip: 'SERVER_TRIGGER',class: 'UpdateTriggerService',function: 'checkAndTriggerUpdate',process: 'Erro no Gatilho',description: `Falha ao verificar e disparar a atualização: ${error.message}`,
        });
    }
  }
}