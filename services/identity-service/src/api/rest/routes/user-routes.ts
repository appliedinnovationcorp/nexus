// User REST API Routes

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { UserCommandHandlers } from '../../../application/handlers/user-command-handlers';
import { UserQueryHandlers } from '../../../application/handlers/user-query-handlers';
import { authMiddleware } from '../../middleware/auth';
import { rateLimitMiddleware } from '../../middleware/rate-limit';

export function createUserRoutes(
  commandHandlers: UserCommandHandlers,
  queryHandlers: UserQueryHandlers
): Router {
  const router = Router();

  // Validation middleware
  const validateRequest = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  };

  // GET /users - Get all users (with filtering)
  router.get('/',
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin', 'moderator']),
    [
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('role').optional().isString(),
      query('isActive').optional().isBoolean(),
      query('organizationId').optional().isUUID(),
      query('searchTerm').optional().isString()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        const users = await queryHandlers.handleGetUsers({
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
          role: req.query.role as string,
          isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
          organizationId: req.query.organizationId as string,
          searchTerm: req.query.searchTerm as string
        });

        res.json({
          data: users,
          meta: {
            count: users.length,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /users/stats - Get user statistics
  router.get('/stats',
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin']),
    [
      query('organizationId').optional().isUUID(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        const stats = await queryHandlers.handleGetUserStats({
          organizationId: req.query.organizationId as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        });

        res.json({ data: stats });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /users/:id - Get user by ID
  router.get('/:id',
    authMiddleware.authenticate,
    [param('id').isUUID()],
    validateRequest,
    async (req, res, next) => {
      try {
        const user = await queryHandlers.handleGetUserById({
          userId: req.params.id
        });

        if (!user) {
          return res.status(404).json({
            error: 'User not found'
          });
        }

        // Users can only see their own data unless they're admin/moderator
        if (req.user.id !== user.id && !['admin', 'moderator'].includes(req.user.role)) {
          return res.status(403).json({
            error: 'Insufficient permissions'
          });
        }

        res.json({ data: user });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /users/:id/activity - Get user activity
  router.get('/:id/activity',
    authMiddleware.authenticate,
    [
      param('id').isUUID(),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('activityType').optional().isString()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        // Users can only see their own activity unless they're admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
          return res.status(403).json({
            error: 'Insufficient permissions'
          });
        }

        const activities = await queryHandlers.handleGetUserActivity({
          userId: req.params.id,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
          activityType: req.query.activityType as string
        });

        res.json({
          data: activities,
          meta: {
            count: activities.length,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /users - Create new user
  router.post('/',
    rateLimitMiddleware.createUser,
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin']),
    [
      body('email').isEmail().normalizeEmail(),
      body('name').isString().trim().isLength({ min: 1, max: 100 }),
      body('role').isIn(['admin', 'user', 'moderator', 'guest']),
      body('organizationId').optional().isUUID()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        const userId = crypto.randomUUID();
        
        await commandHandlers.handleCreateUser({
          id: userId,
          email: req.body.email,
          name: req.body.name,
          role: req.body.role,
          organizationId: req.body.organizationId
        });

        // Get the created user
        const user = await queryHandlers.handleGetUserById({ userId });

        res.status(201).json({
          data: user,
          message: 'User created successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /users/:id - Update user
  router.put('/:id',
    authMiddleware.authenticate,
    [
      param('id').isUUID(),
      body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
      body('email').optional().isEmail().normalizeEmail()
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        // Users can only update their own data unless they're admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
          return res.status(403).json({
            error: 'Insufficient permissions'
          });
        }

        await commandHandlers.handleUpdateUser({
          userId: req.params.id,
          name: req.body.name,
          email: req.body.email
        });

        // Get the updated user
        const user = await queryHandlers.handleGetUserById({
          userId: req.params.id
        });

        res.json({
          data: user,
          message: 'User updated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /users/:id/role - Change user role
  router.put('/:id/role',
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin']),
    [
      param('id').isUUID(),
      body('role').isIn(['admin', 'user', 'moderator', 'guest'])
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        await commandHandlers.handleChangeUserRole({
          userId: req.params.id,
          newRole: req.body.role,
          changedBy: req.user.id
        });

        // Get the updated user
        const user = await queryHandlers.handleGetUserById({
          userId: req.params.id
        });

        res.json({
          data: user,
          message: 'User role updated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /users/:id/deactivate - Deactivate user
  router.post('/:id/deactivate',
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin']),
    [
      param('id').isUUID(),
      body('reason').isString().trim().isLength({ min: 1, max: 500 })
    ],
    validateRequest,
    async (req, res, next) => {
      try {
        await commandHandlers.handleDeactivateUser({
          userId: req.params.id,
          reason: req.body.reason,
          deactivatedBy: req.user.id
        });

        res.json({
          message: 'User deactivated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /users/:id/activate - Activate user
  router.post('/:id/activate',
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin']),
    [param('id').isUUID()],
    validateRequest,
    async (req, res, next) => {
      try {
        await commandHandlers.handleActivateUser({
          userId: req.params.id,
          activatedBy: req.user.id
        });

        res.json({
          message: 'User activated successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /users/:id/login - Record user login
  router.post('/:id/login',
    authMiddleware.authenticate,
    [param('id').isUUID()],
    validateRequest,
    async (req, res, next) => {
      try {
        // Users can only record their own login
        if (req.user.id !== req.params.id) {
          return res.status(403).json({
            error: 'Insufficient permissions'
          });
        }

        await commandHandlers.handleRecordUserLogin({
          userId: req.params.id,
          loginAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          message: 'Login recorded successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
