import { NextRequest, NextResponse } from 'next/server';
import { JWTManager, getCurrentUser } from '@/lib/auth/jwt-simple';
import { getUserService } from '@/lib/api/users-real';

export async function POST(request: NextRequest) {
  try {
    // Get current user from token
    const user = await getCurrentUser();
    
    if (user) {
      // Log logout activity
      const userService = await getUserService();
      await userService.logUserActivity(user.userId, 'user_logout', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    }

    // Clear authentication cookies
    JWTManager.clearTokenCookies();
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('❌ POST /api/auth/logout error:', error);
    
    // Still clear cookies even if there's an error
    JWTManager.clearTokenCookies();
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  }
}
