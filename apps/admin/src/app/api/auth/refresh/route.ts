import { NextRequest, NextResponse } from 'next/server';
import { JWTManager } from '@/lib/auth/jwt-simple';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = JWTManager.getRefreshTokenFromCookies();
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Generate new token pair
    const tokens = await JWTManager.refreshAccessToken(refreshToken);
    
    // Set new cookies
    JWTManager.setTokenCookies(tokens);
    
    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
      message: 'Token refreshed successfully',
    });

  } catch (error) {
    console.error('❌ POST /api/auth/refresh error:', error);
    
    // Clear cookies if refresh fails
    JWTManager.clearTokenCookies();
    
    if (error instanceof Error) {
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired refresh token' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return NextResponse.json(
          { success: false, error: 'User not found or inactive' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
