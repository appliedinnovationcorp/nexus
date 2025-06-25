import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { oauthRoutes } from './routes/oauth';
import { mfaRoutes } from './routes/mfa';
import { healthRoutes } from './routes/health';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { metricsPlugin } from './plugins/metrics';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

async function buildApp() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    });

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      sign: {
        expiresIn: '24h'
      }
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      redis: await connectRedis()
    });

    // Register metrics plugin
    await fastify.register(metricsPlugin);

    // Register middleware
    fastify.setErrorHandler(errorHandler);
    fastify.addHook('preHandler', authMiddleware);

    // Register routes
    await fastify.register(healthRoutes, { prefix: '/health' });
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(userRoutes, { prefix: '/users' });
    await fastify.register(oauthRoutes, { prefix: '/oauth' });
    await fastify.register(mfaRoutes, { prefix: '/mfa' });

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    logger.info('Auth service initialized successfully');
    return fastify;

  } catch (error) {
    logger.error('Failed to initialize auth service:', error);
    throw error;
  }
}

async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || '8001');
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    logger.info(`🚀 Auth service running on http://${host}:${port}`);

  } catch (error) {
    logger.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildApp };
