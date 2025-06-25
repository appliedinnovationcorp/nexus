import { NextRequest, NextResponse } from 'next/server';
import { createGoogleOAuthProvider } from '@/lib/auth/providers/google';
import { getUserService } from '@/lib/api/users-real';
import { JWTManager } from '@/lib/auth/jwt-simple';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authentication failed';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=No authorization code received`
      );
    }

    // Initialize Google OAuth provider
    const googleProvider = createGoogleOAuthProvider();
    
    // Exchange code for tokens
    const tokenResponse = await googleProvider.exchangeCodeForTokens(code);
    
    // Get user info from Google
    const googleUser = await googleProvider.getUserInfo(tokenResponse.access_token);
    
    if (!googleUser.verified_email) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=Email not verified with Google`
      );
    }

    // Get user service
    const userService = await getUserService();
    
    // Check if user already exists
    const existingUsers = await userService.getUsers({ search: googleUser.email, limit: 1 });
    let user = existingUsers.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
    
    if (user) {
      // Update existing user with Google info
      user = await userService.updateUser(user.id, {
        name: user.name || googleUser.name,
        avatarUrl: user.avatarUrl || googleUser.picture,
        emailVerified: true,
        lastSignInAt: new Date().toISOString(),
      });
    } else {
      // Create new user
      user = await userService.createUser({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        role: 'user',
        status: 'active',
        emailVerified: true,
        provider: 'google',
        providerId: googleUser.id,
      });
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

    // Log OAuth login activity
    await userService.logUserActivity(user.id, 'oauth_login', {
      provider: 'google',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

// Initiate Google OAuth flow
export async function POST(request: NextRequest) {
  try {
    const googleProvider = createGoogleOAuthProvider();
    
    // Generate state for CSRF protection
    const state = uuidv4();
    
    // Store state in session/cookie for verification
    // In a real implementation, you'd store this securely
    
    const authUrl = googleProvider.generateAuthUrl(state);
    
    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });

  } catch (error) {
    console.error('❌ Google OAuth initiation error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
