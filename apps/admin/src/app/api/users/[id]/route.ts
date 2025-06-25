import { NextRequest, NextResponse } from 'next/server';
import { getUserService } from '@/lib/api/users-real';
import { authenticateRequest } from '@/lib/auth/jwt-simple';
import { UpdateUserData } from '@/types/user';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  organizationId: z.string().uuid().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params;
    
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Get user service
    const userService = await getUserService();
    
    // Fetch user
    const targetUser = await userService.getUserById(params.id);
    
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only view their own profile unless admin
    if (user.userId !== params.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Remove sensitive data from response
    const { password_hash, ...safeUser } = targetUser as any;
    
    return NextResponse.json({
      success: true,
      data: safeUser,
    });

  } catch (error) {
    console.error(`❌ GET /api/users error:`, error);
    
    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params;
    
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Check permissions - users can only update their own profile unless admin
    if (user.userId !== params.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updateData = updateUserSchema.parse(body);

    // Non-admin users cannot change role or status
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      delete updateData.role;
      delete updateData.status;
    }

    // Get user service
    const userService = await getUserService();
    
    // Update user
    const updatedUser = await userService.updateUser(params.id, updateData);
    
    // Remove sensitive data from response
    const { password_hash, ...safeUser } = updatedUser as any;
    
    return NextResponse.json({
      success: true,
      data: safeUser,
      message: 'User updated successfully',
    });

  } catch (error) {
    console.error(`❌ PUT /api/users error:`, error);
    
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
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params;
    
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Only admins can delete users
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (user.userId === params.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user service
    const userService = await getUserService();
    
    // Delete user (soft delete)
    await userService.deleteUser(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error(`❌ DELETE /api/users error:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('authorization')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
