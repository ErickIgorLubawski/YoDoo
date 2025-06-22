// ecosystem/config.js
module.exports = {
    apps : [{
      name: "yodoo-backend", // Nome para identificar seu processo no PM2 (você já usou 'yodoo-backend')
      script: "./dist/server.js", // Caminho para o seu arquivo principal compilado
      
      // Opcional: Modo de execução (recomendo 'cluster' em produção para aproveitar CPUs)
      instances: "max",       // Use "max" para todos os núcleos, ou 1 para apenas um processo
      exec_mode: "cluster",   // 'cluster' ou 'fork'. 'cluster' é para múltiplas instâncias
      
      // Variáveis de Ambiente para o ambiente de TESTE
      // (Estas serão usadas quando você rodar `pm2 start ecosystem/config.js` sem `--env production`)
      env: {
        NODE_ENV: "development", // Ou "test" se preferir
        PORTA_SERVER: 3001, // Sua porta
        PORTA_CENTRAL: 557,  // Sua porta para a Central
        DATABASE_URL: "mongodb://mrdprototype.ddns.net:27017/biofacial", // Sua URL de MongoDB de teste
        JWT_SECRET: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDY0ODkyMDYsImV4cCI6MTc0NjU3NTYwNn0.JmQ6GqPXbmlaTF6cXMwHtg6Jf-hPonx2721i8VoGBiM",
        // ... adicione quaisquer outras variáveis de ambiente que seu app utilize e que sejam específicas do ambiente de TESTE
      },
      
      // Variáveis de Ambiente para o ambiente de PRODUÇÃO
      // (Estas serão usadas quando você rodar `pm2 start ecosystem/config.js --env production`)
      env_production: {
        NODE_ENV: "production",
        PORTA_SERVER: 3001, // A porta em produção (pode ser a mesma ou diferente)
        PORTA_CENTRAL: 557,  // A porta da Central em produção
        DATABASE_URL: "mongodb://192.168.101.1:27017/biofacial", // *** MUDE ESTA PARA A URL DO SEU MONGO DB DE PRODUÇÃO ***
        JWT_SECRET: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDY0ODkyMDYsImV4cCI6MTc0NjU3NTYwNn0.JmQ6GqPXbmlaTF6cXMwHtg6Jf-hPonx2721i8VoGBiM", // *** MUDE ESTA PARA UM SEGREDO FORTE E ÚNICO PARA PRODUÇÃO ***
        // ... adicione quaisquer outras variáveis de ambiente que seu app utilize e que sejam específicas do ambiente de PRODUÇÃO
      },
    }]
};