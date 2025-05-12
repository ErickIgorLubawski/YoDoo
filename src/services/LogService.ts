import { prisma } from "../config/db";
import { LogDTO } from "../DTOs/LogDTO";


export class LogService {
  async createLog(data: LogDTO): Promise<void> {
    await prisma.log.create({
      data: {
        ...data,
        datetime: new Date(),
      },
    });
  }
}
