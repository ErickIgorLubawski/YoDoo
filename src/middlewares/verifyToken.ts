import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
  //const authHeader = request.headers.authorization;
  const token = request.headers['token'];
  if (!token) {
    return reply.status(401).send({ resp: 'Token não fornecido no header' });
  }
  if (!token || typeof token !== 'string') {
    return reply.status(401).send({ resp: 'Token não fornecido' });
  }
  //const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (err) {
    return reply.status(401).send({ resp: 'Token inválido ou expirado' });
  }
}
