import { NextRequest, NextResponse } from 'next/server';
import { getUserService } from '@/lib/api/users-real';
import { authenticateRequest } from '@/lib/auth/jwt-simple';
import { CreateUserData, UserFilters } from '@/types/user';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  phone: z.string().optional(),
  organizationId: z.string().uuid().optional(),
});

const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  organizationId: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = userFiltersSchema.parse({
      search: searchParams.get('search'),
      role: searchParams.get('role'),
      status: searchParams.get('status'),
      organizationId: searchParams.get('organizationId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    // Get user service
    const userService = await getUserService();
    
    // Fetch users
    const users = await userService.getUsers(filters);
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: users.length,
      },
    });

  } catch (error) {
    console.error('❌ GET /api/users error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('authorization')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { success: false, error: 'Invalid query parameters', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const userData = createUserSchema.parse(body);

    // Get user service
    const userService = await getUserService();
    
    // Create user
    const newUser = await userService.createUser(userData);
    
    // Remove sensitive data from response
    const { password_hash, ...safeUser } = newUser as any;
    
    return NextResponse.json({
      success: true,
      data: safeUser,
      message: 'User created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/users error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('authorization')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
