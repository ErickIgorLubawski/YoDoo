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


// // src/middlewares/verifyToken.ts
// import { FastifyRequest, FastifyReply } from 'fastify';
// import jwt from 'jsonwebtoken';

// export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
//   // 1) Puxar o header Authorization
//   const authHeader = request.headers.authorization;
//   if (!authHeader) {
//     return reply.status(401).send({ resp: 'Authorization header não fornecido' });
//   }

//   // 2) Validar formato Bearer <token>
//   const parts = authHeader.split(' ');
//   if (parts.length !== 2 || parts[0] !== 'Bearer') {
//     return reply.status(401).send({ resp: 'Formato de token inválido' });
//   }
//   const token = parts[1];

//   // 3) Verificar JWT
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//     // você pode opcionalmente anexar o payload ao request:
//     // (request as any).user = decoded;
//   } catch (err) {
//     return reply.status(401).send({ resp: 'Token inválido ou expirado' });
//   }
// }
