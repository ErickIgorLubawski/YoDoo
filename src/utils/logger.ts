import { LogService } from "../services/LogService";
import { LogDTO } from "../DTOs/LogDTO";

const logger = new LogService();

export const logExecution = async (log: LogDTO) => {
  try {
    await logger.createLog(log);
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
};
