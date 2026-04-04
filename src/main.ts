import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isExplicitlyAllowed = allowedOrigins.includes(origin);
      const isLocalhostPort = /^https?:\/\/localhost:\d+$/.test(origin);
      const isLoopbackPort = /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin);
      const isPrivateNetworkPort =
        /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) ||
        /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);

      if (
        isExplicitlyAllowed ||
        isLocalhostPort ||
        isLoopbackPort ||
        isPrivateNetworkPort
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4500);
}
bootstrap();
