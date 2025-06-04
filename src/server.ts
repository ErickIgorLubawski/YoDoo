import Fastify from 'fastify';
import { connectDB, prisma } from './config/db';
import { centralRoutes } from './routes/centrais-router';
import { equipamentoRoutes } from './routes/equipamentos-router';
import cors from '@fastify/cors';
import { usuarioRoutes } from './routes/usuario-router';
import { logExecution } from './utils/logger';


const app = Fastify({logger: true});

app.setErrorHandler((error, request, reply) => {
    
    reply.status(400).send({ task: error.message });
});

const start = async () => {

    try {
        await connectDB(); // testa a conexão com o banco
        await app.register(cors)
        await app.register(usuarioRoutes);
        await app.register(centralRoutes);
        await app.register(equipamentoRoutes);
        const porta = process.env.PORTA_SERVER;
        if (!porta) {
            console.log('Variável de ambiente PORTA_CENTRAL não definida.')
           throw new Error('Variável de ambiente PORTA_CENTRAL não definida.');
        }
        await app.listen({ port: +porta, host: '0.0.0.0' });


        console.log(`✅ Servidor iniciado na porta ${process.env.PORTA_SERVER}`);
        console.log(`✅ Porta central ${process.env.PORTA_CENTRAL}`)

        
        await logExecution({ ip: '1.1.1.2', class: 'Server',function: 'start',process: 'Inicialização do servidor',description: 'Servidor e banco iniciados com sucesso',});
    } catch (resp) {
        app.log.error(resp, 'Erro ao iniciar API no servidor');
    process.exit(1);
    }
}

start();