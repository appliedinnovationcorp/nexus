import { NextRequest, NextResponse } from 'next/server';
import { getUserService } from '@/lib/api/users-real';
import { JWTManager } from '@/lib/auth/jwt-simple';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    // Get user service
    const userService = await getUserService();
    
    // Find user by email
    const users = await userService.getUsers({ search: email, limit: 1 });
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Verify password (assuming password_hash field exists)
    const userWithPassword = await userService.getUserById(user.id) as any;
    if (!userWithPassword.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const tokens = JWTManager.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    // Set cookies
    JWTManager.setTokenCookies(tokens);

    // Update last sign in
    await userService.updateUser(user.id, {
      lastSignInAt: new Date().toISOString(),
    });

    // Log login activity
    await userService.logUserActivity(user.id, 'user_login', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // Return user data (without sensitive info)
    const { password_hash, ...safeUser } = userWithPassword;
    
    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        tokens: {
          accessToken: tokens.accessToken,
          // Don't send refresh token in response body for security
        },
      },
      message: 'Login successful',
    });

  } catch (error) {
    console.error('❌ POST /api/auth/login error:', error);
    
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

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
