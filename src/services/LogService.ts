import { prisma } from "../config/db";
import { LogDTO } from "../DTOs/LogDTO";


export class LogService {
  async createLog(data: LogDTO){
    await prisma.logs.create({
      data: {
        ...data,
        datetime: new Date(),
      },
    });
  }
}
