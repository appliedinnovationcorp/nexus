// Identity Service - Main entry point

import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

import { config } from './config';
import { logger } from './infrastructure/logging';
import { DatabaseConnection } from './infrastructure/database/connection';
import { EventBusConnection } from './infrastructure/events/event-bus';
import { setupRoutes } from './api/rest/routes';
import { UserResolver } from './api/graphql/resolvers/user-resolver';
import { AccountResolver } from './api/graphql/resolvers/account-resolver';
import { authMiddleware } from './api/middleware/auth';
import { errorHandler } from './api/middleware/error-handler';
import { requestLogger } from './api/middleware/request-logger';

async function startServer() {
  try {
    // Initialize infrastructure
    await DatabaseConnection.initialize();
    await EventBusConnection.initialize();
    
    logger.info('Infrastructure initialized successfully');

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true
    }));
    app.use(compression());

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    app.use(requestLogger);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        service: 'identity-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // REST API routes
    app.use('/api/v1', setupRoutes());

    // GraphQL server
    const schema = await buildSchema({
      resolvers: [UserResolver, AccountResolver],
      authChecker: authMiddleware.graphqlAuthChecker,
      validate: false
    });

    const apolloServer = new ApolloServer({
      schema,
      context: ({ req, res }) => ({
        req,
        res,
        user: req.user
      }),
      introspection: config.env !== 'production',
      playground: config.env !== 'production'
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // Already handled by Express CORS
    });

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Identity Service running on port ${config.port}`);
      logger.info(`GraphQL endpoint: http://localhost:${config.port}${apolloServer.graphqlPath}`);
      logger.info(`Environment: ${config.env}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      
      server.close(async () => {
        await apolloServer.stop();
        await DatabaseConnection.close();
        await EventBusConnection.close();
        
        logger.info('Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      
      server.close(async () => {
        await apolloServer.stop();
        await DatabaseConnection.close();
        await EventBusConnection.close();
        
        logger.info('Server closed successfully');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
