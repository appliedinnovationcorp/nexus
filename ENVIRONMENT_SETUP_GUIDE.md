# 🔐 Environment Variables Setup Guide

This guide provides step-by-step instructions for obtaining and configuring all required environment variables for the Nexus platform.

## 📁 Environment Files Structure

```
nexus/
├── .env.local                          # Root-level local development
├── docker/environments/
│   ├── .env.development               # Docker development
│   ├── .env.staging                   # Docker staging
│   ├── .env.production               # Docker production
│   └── .env.example                  # Template with all options
└── apps/
    ├── web/.env.local                # Web app specific
    ├── admin/.env.local              # Admin dashboard specific
    ├── client-portal/.env.local      # Client portal specific
    └── ai-tools/.env.local           # AI tools specific
```

## 🚀 Quick Start (Minimum Required)

For basic local development, you only need:

1. **Generate secrets automatically:**
   ```bash
   make generate-secrets
   # This creates secure NEXTAUTH_SECRET, JWT_SECRET, etc.
   ```

2. **Or set up everything at once:**
   ```bash
   make setup-complete
   # Creates environment files AND generates secrets
   ```

3. **Start with defaults** - Most features will work with mock data

## 🔑 Required Environment Variables by Service

### 🌐 **Web Application** (`apps/web/.env.local`)

#### **Minimum Required:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret-here
```

#### **Optional (for full functionality):**
```env
# OAuth Providers (see instructions below)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 🤖 **AI Tools Platform** (`apps/ai-tools/.env.local`)

#### **Required for AI Features:**
```env
# OpenAI (Required for most AI features)
OPENAI_API_KEY=your-openai-api-key

# Optional AI Providers
ANTHROPIC_API_KEY=your-anthropic-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
```

### 💳 **Payment Processing** (Production Only)

```env
# Stripe (for billing features)
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 📧 **Email Services** (Production Only)

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Or SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

## 📋 Step-by-Step Setup Instructions

### 0. 🔐 **Generate Secure Secrets (Required First Step)**

Before setting up any services, you need to generate secure secrets:

#### **Method 1: Automated (Recommended)**
```bash
# Generate all secrets automatically
make generate-secrets

# Or complete setup (creates files + generates secrets)
make setup-complete
```

#### **Method 2: Manual Generation**
```bash
# Using OpenSSL (most secure)
openssl rand -base64 32

# Using Node.js
node scripts/generate-secret.js

# Using online generator
# Visit: https://generate-secret.vercel.app/32
```

#### **Method 3: Using our Node.js script**
```bash
# Generate NEXTAUTH_SECRET
node scripts/generate-secret.js
# Output: Jk7+9XqZ8YvN2mR5tA3bC6dE8fG1hI4jK7lM9nO2pQ

# Generate longer JWT secret
node scripts/generate-secret.js 64
```

**Add the generated secret to your environment files:**
```env
NEXTAUTH_SECRET=Jk7+9XqZ8YvN2mR5tA3bC6dE8fG1hI4jK7lM9nO2pQ
JWT_SECRET=your-longer-jwt-secret-here
SESSION_SECRET=your-session-secret-here
```

### 1. 🔐 **Authentication Services**

#### **Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### **GitHub OAuth Setup:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: "Nexus Platform"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 2. 🤖 **AI Services**

#### **OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (save it immediately - you won't see it again)

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### **Anthropic Claude API:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to "API Keys"
4. Create a new API key
5. Copy the key

```env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

#### **Hugging Face API:**
1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up or log in
3. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "Read" permissions
5. Copy the token

```env
HUGGINGFACE_API_KEY=hf_your-huggingface-token
```

### 3. 💳 **Payment Processing (Stripe)**

#### **Stripe Setup:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Go to "Developers" → "API keys"
4. Copy Publishable key and Secret key
5. For webhooks: Go to "Developers" → "Webhooks"
6. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
7. Copy webhook signing secret

```env
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 4. 📧 **Email Services**

#### **Gmail SMTP Setup:**
1. Enable 2-factor authentication on your Google account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Go to "Security" → "App passwords"
4. Generate an app password for "Mail"
5. Use this password (not your regular password)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
EMAIL_FROM=noreply@yourdomain.com
```

#### **SendGrid Setup (Alternative):**
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up or log in
3. Go to "Settings" → "API Keys"
4. Create a new API key with "Full Access"
5. Copy the API key

```env
SENDGRID_API_KEY=SG.your-sendgrid-api-key
```

### 5. ☁️ **File Storage (AWS S3)**

#### **AWS S3 Setup:**
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Create an S3 bucket
3. Go to IAM → Users → Create user
4. Attach policy: `AmazonS3FullAccess` (or create custom policy)
5. Create access key
6. Copy Access Key ID and Secret Access Key

```env
AWS_ACCESS_KEY_ID=AKIA-your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=your-bucket-name
```

### 6. 🔍 **Vector Databases (for RAG features)**

#### **Pinecone Setup:**
1. Go to [Pinecone](https://app.pinecone.io/)
2. Sign up or log in
3. Create a new index
4. Go to "API Keys"
5. Copy API key and environment

```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX=your-index-name
```

### 7. 📊 **Analytics & Monitoring**

#### **Sentry Error Tracking:**
1. Go to [Sentry](https://sentry.io/)
2. Create a new project
3. Copy the DSN

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 🔧 Environment File Templates

### **Minimal Development Setup** (`.env.local`)
```env
# Minimum required for local development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=local-dev-secret-change-this
JWT_SECRET=local-jwt-secret-change-this

# Database (using Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexus_dev
REDIS_URL=redis://localhost:6379

# AI Features (optional - leave empty to use mocks)
OPENAI_API_KEY=
```

### **Full Production Setup** (`docker/environments/.env.production`)
```env
# Production configuration
NODE_ENV=production
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Secure secrets (generate strong passwords)
JWT_SECRET=your-super-secure-jwt-secret-64-characters-long
SESSION_SECRET=your-super-secure-session-secret-64-characters-long
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-64-characters-long

# Production database
DATABASE_URL=postgresql://user:password@prod-db:5432/nexus_prod

# All the API keys from above sections
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
GOOGLE_CLIENT_ID=your-google-client-id
# ... etc
```

## 🚨 Security Best Practices

### **1. Never Commit Secrets**
```bash
# Add to .gitignore (already included)
.env.local
.env.production
.env.staging
*.env
```

### **2. Use Different Keys for Different Environments**
- Development: Use test/sandbox keys
- Staging: Use test keys with production-like data
- Production: Use live/production keys

### **3. Rotate Keys Regularly**
- Change API keys every 90 days
- Use key rotation for production systems
- Monitor key usage and access

### **4. Use Environment-Specific Secrets**
```env
# Development
OPENAI_API_KEY=sk-test-your-dev-key

# Production  
OPENAI_API_KEY=sk-live-your-prod-key
```

## 🔄 Environment Loading Order

The application loads environment variables in this order:

1. **System environment variables**
2. **`.env.local`** (local development, not committed)
3. **`.env.development`** (development environment)
4. **`.env.production`** (production environment)
5. **Docker environment files** (when using Docker)

## 🛠️ Troubleshooting

### **Common Issues:**

#### **"Environment variable not found"**
- Check file location and naming
- Ensure no typos in variable names
- Restart development server after changes

#### **"Invalid API key"**
- Verify key is correct and not expired
- Check if key has required permissions
- Ensure using correct environment (test vs live)

#### **"CORS errors"**
- Update `CORS_ORIGIN` to include your domain
- Check `NEXT_PUBLIC_API_URL` is correct

### **Debug Environment Variables:**
```bash
# Check loaded environment variables
node -e "console.log(process.env)" | grep NEXT_PUBLIC

# Or in your app
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  // Don't log secrets!
});
```

## 📞 Getting Help

If you need help obtaining any of these keys or setting up services:

1. **Check service documentation** - Each service has detailed setup guides
2. **Use free tiers** - Most services offer free tiers for development
3. **Start minimal** - You can add services incrementally
4. **Use mocks** - The platform includes mock implementations for development

---

**🔐 Keep your secrets secure and never commit them to version control!**
