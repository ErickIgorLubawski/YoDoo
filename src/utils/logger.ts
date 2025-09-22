import { LogService } from '../services/LogService';
import pino from 'pino'; // Importe o pino

const logService = new LogService();
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

export function logExecution(data: any) {
  logService.createLog(data);
  // Adicione esta linha para imprimir no console
  logger.info(data);
}