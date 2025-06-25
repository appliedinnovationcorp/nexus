// Simple JWT implementation without complex types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTManager {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
    // Simple token generation - in production, use proper JWT library
    const now = Math.floor(Date.now() / 1000);
    const accessTokenPayload = {
      ...payload,
      iat: now,
      exp: now + (15 * 60), // 15 minutes
      iss: 'nexus-platform',
      aud: 'nexus-admin'
    };
    
    const refreshTokenPayload = {
      userId: payload.userId,
      iat: now,
      exp: now + (7 * 24 * 60 * 60), // 7 days
      iss: 'nexus-platform',
      aud: 'nexus-admin'
    };

    // For demo purposes, we'll create simple base64 encoded tokens
    // In production, use proper JWT signing
    const accessToken = 'demo.' + Buffer.from(JSON.stringify(accessTokenPayload)).toString('base64');
    const refreshToken = 'demo.' + Buffer.from(JSON.stringify(refreshTokenPayload)).toString('base64');

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      if (!token.startsWith('demo.')) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(Buffer.from(token.substring(5), 'base64').toString());
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Access token expired');
      }
      
      return payload as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string } {
    try {
      if (!token.startsWith('demo.')) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(Buffer.from(token.substring(5), 'base64').toString());
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Refresh token expired');
      }
      
      return { userId: payload.userId };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const { userId } = this.verifyRefreshToken(refreshToken);
    
    // Get user details from database
    const { getUserService } = await import('@/lib/api/users-real');
    const userService = await getUserService();
    const user = await userService.getUserById(userId);
    
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    // Generate new token pair
    return this.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });
  }

  static setTokenCookies(tokens: TokenPair): void {
    // This would be implemented with actual cookie setting in a real app
    console.log('Setting tokens:', { accessToken: '***', refreshToken: '***' });
  }

  static clearTokenCookies(): void {
    console.log('Clearing tokens');
  }

  static getTokenFromCookies(): string | null {
    return null;
  }

  static getRefreshTokenFromCookies(): string | null {
    return null;
  }

  static decodeTokenWithoutVerification(token: string): JWTPayload | null {
    try {
      if (!token.startsWith('demo.')) {
        return null;
      }
      return JSON.parse(Buffer.from(token.substring(5), 'base64').toString());
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeTokenWithoutVerification(token);
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  }

  static getTokenExpirationTime(token: string): Date | null {
    const decoded = this.decodeTokenWithoutVerification(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  }
}

// Middleware helper for API routes
export async function authenticateRequest(request: Request): Promise<JWTPayload> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  return JWTManager.verifyAccessToken(token);
}

// Helper for server components
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const token = JWTManager.getTokenFromCookies();
    if (!token) return null;
    
    return JWTManager.verifyAccessToken(token);
  } catch {
    return null;
  }
}

// Helper to check if user has required role
export function hasRole(user: JWTPayload, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

// Helper to check if user has admin access
export function isAdmin(user: JWTPayload): boolean {
  return hasRole(user, ['admin', 'super_admin']);
}
