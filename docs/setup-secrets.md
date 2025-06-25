# 🔐 CI/CD Secrets Setup Guide

This guide will help you set up all required secrets for your Nexus CI/CD pipeline.

## 🚀 Quick Setup Commands

### 1. Vercel Setup (Required)

```bash
# Login to Vercel
vercel login

# Link your project to Vercel
vercel link

# Get project information
vercel project ls
```

**Get your Vercel secrets:**
1. Go to https://vercel.com/account/tokens
2. Create a new token named "GitHub Actions"
3. Copy the token value

**Find your Project and Org IDs:**
- After running `vercel link`, check the `.vercel/project.json` file
- Or go to your Vercel dashboard → Project Settings → General

### 2. Turbo Remote Caching (Recommended)

```bash
# Login to Vercel (Turbo uses Vercel for caching)
npx turbo login

# Link your repository
npx turbo link
```

**Get your Turbo secrets:**
- Go to https://vercel.com/account/tokens
- Use the same token as Vercel, or create a separate one
- Team name is usually your Vercel team/username

### 3. Security Tools (Optional but Recommended)

**Snyk (Vulnerability Scanning):**
1. Go to https://snyk.io
2. Sign up/login with GitHub
3. Go to Account Settings → API Token
4. Copy your token

**CodeCov (Code Coverage):**
1. Go to https://codecov.io
2. Login with GitHub
3. Add your repository
4. Copy the upload token

## 🔧 Adding Secrets to GitHub

Go to your GitHub repository: https://github.com/appliedinnovationcorp/nexus

1. Click **Settings** tab
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets one by one:

### Required Secrets:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel API token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Your Vercel team/org ID | `.vercel/project.json` or Vercel dashboard |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | `.vercel/project.json` or Vercel dashboard |

### Recommended Secrets:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `TURBO_TOKEN` | Turbo remote caching token | Same as VERCEL_TOKEN |
| `TURBO_TEAM` | Your Turbo team name | Your Vercel team name |
| `SNYK_TOKEN` | Snyk vulnerability scanning | https://snyk.io/account |

### Optional Secrets:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `CODECOV_TOKEN` | Code coverage reporting | https://codecov.io |
| `SLACK_WEBHOOK` | Slack notifications | Slack App settings |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI reporting | GitHub App for Lighthouse |

## 🎯 Testing Your Setup

After adding the secrets, test your pipeline:

1. Create a new branch:
   ```bash
   git checkout -b test-ci-cd
   ```

2. Make a small change:
   ```bash
   echo "# Test CI/CD" >> TEST.md
   git add TEST.md
   git commit -m "test: trigger CI/CD pipeline"
   git push origin test-ci-cd
   ```

3. Create a Pull Request on GitHub
4. Watch the Actions tab to see your pipeline run!

## 🔍 Vercel Project Configuration

After linking with Vercel, you might want to configure:

1. **Environment Variables** (in Vercel dashboard):
   - `NODE_ENV=production`
   - Any API keys your apps need

2. **Build Settings**:
   - Build Command: `pnpm build`
   - Output Directory: `dist` or `.next`
   - Install Command: `pnpm install`

3. **Domains**: Configure your custom domains if needed

## 🚨 Security Best Practices

- Never commit secrets to your repository
- Use environment-specific secrets for different stages
- Regularly rotate your tokens
- Use least-privilege access for tokens
- Monitor secret usage in GitHub Actions logs

## 🆘 Troubleshooting

**Common Issues:**

1. **Vercel deployment fails**: Check if your build command is correct
2. **Turbo cache not working**: Ensure TURBO_TOKEN and TURBO_TEAM are set
3. **Tests failing**: Make sure your test scripts are properly configured
4. **Security scans failing**: Check if tokens have proper permissions

**Getting Help:**
- Check GitHub Actions logs for detailed error messages
- Vercel deployment logs in Vercel dashboard
- Feel free to ask for help with specific error messages!
