import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

process.env.APP_ROLE = 'worker';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    app.enableShutdownHooks();
  } finally {
    delete process.env.APP_ROLE;
  }
}

bootstrap().catch((erro) => {
  console.error('Falha ao iniciar o worker', erro);
  process.exit(1);
});
