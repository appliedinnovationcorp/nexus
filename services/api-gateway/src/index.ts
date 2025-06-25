import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ApolloServer } from '@apollo/server';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { fastifyApolloHandler } from '@apollo/server-integration-fastify';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { serviceDiscovery } from './services/discovery';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { loggingMiddleware } from './middleware/logging';
import { metricsMiddleware } from './middleware/metrics';
import { healthRoutes } from './routes/health';
import { logger } from './utils/logger';
import { connectRedis } from './config/redis';

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

    await fastify.register(helmet);

    await fastify.register(rateLimit, {
      max: 1000,
      timeWindow: '1 minute',
      redis: await connectRedis()
    });

    // Register middleware
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', rateLimitMiddleware);
    fastify.addHook('preHandler', loggingMiddleware);
    fastify.addHook('preHandler', metricsMiddleware);

    // Setup GraphQL Gateway
    const gateway = new ApolloGateway({
      supergraphSdl: new IntrospectAndCompose({
        subgraphs: await getSubgraphConfigs()
      }),
      buildService: ({ url }) => ({
        process: ({ request, context }) => {
          // Add authentication headers
          if (context.user) {
            request.http.headers.set('x-user-id', context.user.id);
            request.http.headers.set('x-user-roles', JSON.stringify(context.user.roles));
          }
          return request;
        }
      })
    });

    const apolloServer = new ApolloServer({
      gateway,
      plugins: [
        {
          requestDidStart() {
            return {
              willSendResponse(requestContext) {
                // Add custom headers
                requestContext.response.http.headers.set('x-powered-by', 'Nexus API Gateway');
              }
            };
          }
        }
      ]
    });

    await apolloServer.start();

    // Register GraphQL endpoint
    await fastify.register(fastifyApolloHandler(apolloServer), {
      context: async (request) => ({
        user: request.user,
        headers: request.headers
      })
    });

    // Setup REST API proxying
    await setupRestProxies();

    // Register health routes
    await fastify.register(healthRoutes, { prefix: '/health' });

    logger.info('API Gateway initialized successfully');
    return fastify;

  } catch (error) {
    logger.error('Failed to initialize API Gateway:', error);
    throw error;
  }
}

async function getSubgraphConfigs() {
  const services = await serviceDiscovery.getServices();
  
  return services
    .filter(service => service.graphql)
    .map(service => ({
      name: service.name,
      url: `${service.url}/graphql`
    }));
}

async function setupRestProxies() {
  const services = await serviceDiscovery.getServices();

  for (const service of services) {
    if (service.rest) {
      const proxyMiddleware = createProxyMiddleware({
        target: service.url,
        changeOrigin: true,
        pathRewrite: {
          [`^/api/${service.name}`]: ''
        },
        onProxyReq: (proxyReq, req) => {
          // Add authentication headers
          if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-roles', JSON.stringify(req.user.roles));
          }
        },
        onError: (err, req, res) => {
          logger.error(`Proxy error for ${service.name}:`, err);
          res.status(502).json({ error: 'Bad Gateway' });
        }
      });

      // Register proxy route
      fastify.all(`/api/${service.name}/*`, async (request, reply) => {
        return new Promise((resolve, reject) => {
          proxyMiddleware(request.raw, reply.raw, (err) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });
      });
    }
  }
}

async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || '8000');
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    logger.info(`🚀 API Gateway running on http://${host}:${port}`);
    logger.info(`📊 GraphQL Playground: http://${host}:${port}/graphql`);

  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
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
