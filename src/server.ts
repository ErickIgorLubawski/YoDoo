import Fastify from 'fastify';
import { connectDB, prisma } from './config/db';
import { centralRoutes } from './routes/centrais-router';
import { equipamentoRoutes } from './routes/equipamentos-router';
import cors from '@fastify/cors';
import { usuarioRoutes } from './routes/usuario-router';



const app = Fastify({logger: true});

app.setErrorHandler((error, request, reply) => {
    reply.status(400).send({ message: error.message });
});

const start = async () => {

    try {
        await connectDB(); // testa a conexão com o banco
        await app.register(cors)
        await app.register(usuarioRoutes);
        await app.register(centralRoutes);
        await app.register(equipamentoRoutes);
        await app.listen({ port: 3001, host: '0.0.0.0' });
        console.log('✅ Servidor iniciado na porta 3000');

    } catch (err) {
        app.log.error(err, 'Erro ao iniciar API no servidor');
    process.exit(1);
    }
}

start();