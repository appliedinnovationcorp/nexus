export interface AuthProvider {
  id: string;
  name: string;
  type: "email" | "phone" | "oauth" | "saml" | "magic-link";
  enabled: boolean;
  config: Record<string, any>;
  icon?: string;
  description: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaMethods: ("totp" | "sms" | "email")[];
  providers: string[];
  metadata: Record<string, any>;
  lastSignIn: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  permissions: string[];
}

export interface AuthPolicy {
  id: string;
  name: string;
  description: string;
  table: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  policy: string; // SQL policy
  roles: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MFASetup {
  userId: string;
  method: "totp" | "sms" | "email";
  secret?: string;
  qrCode?: string;
  backupCodes: string[];
  verified: boolean;
}

export interface AuthSettings {
  enableSignup: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number;
  maxSessions: number;
  enableMFA: boolean;
  mfaRequired: boolean;
  providers: AuthProvider[];
  jwtSecret: string;
  jwtExpiry: number;
  refreshTokenExpiry: number;
}
