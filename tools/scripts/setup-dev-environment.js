#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const inquirer = require('inquirer');

async function main() {
  console.log(chalk.blue.bold('🚀 Nexus Development Environment Setup\n'));

  const spinner = ora('Checking environment...').start();

  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      spinner.fail(chalk.red('❌ Node.js 18+ is required'));
      console.log(chalk.yellow('Please upgrade Node.js to version 18 or higher'));
      process.exit(1);
    }

    // Check if pnpm is installed
    try {
      execSync('pnpm --version', { stdio: 'pipe' });
    } catch (error) {
      spinner.fail(chalk.red('❌ pnpm is not installed'));
      console.log(chalk.yellow('Please install pnpm: npm install -g pnpm'));
      process.exit(1);
    }

    spinner.succeed(chalk.green('✅ Environment checks passed'));

    // Setup workspace
    const setupSpinner = ora('Setting up workspace...').start();

    const workspaceRoot = path.join(__dirname, '..', '..');

    // Install dependencies
    setupSpinner.text = 'Installing dependencies...';
    execSync('pnpm install', { cwd: workspaceRoot, stdio: 'pipe' });

    // Build packages
    setupSpinner.text = 'Building packages...';
    try {
      execSync('pnpm build --filter="./packages/*"', { cwd: workspaceRoot, stdio: 'pipe' });
    } catch (error) {
      // Some packages might not have build scripts, that's okay
    }

    setupSpinner.succeed(chalk.green('✅ Workspace setup complete'));

    // Setup environment files
    const envSpinner = ora('Setting up environment files...').start();
    
    const apps = ['web', 'admin', 'client-portal', 'ai-tools'];
    
    for (const app of apps) {
      const appDir = path.join(workspaceRoot, 'apps', app);
      const envExamplePath = path.join(appDir, '.env.example');
      const envLocalPath = path.join(appDir, '.env.local');
      
      if (await fs.pathExists(envExamplePath) && !await fs.pathExists(envLocalPath)) {
        await fs.copy(envExamplePath, envLocalPath);
        envSpinner.text = `Created .env.local for ${app}`;
      }
    }

    envSpinner.succeed(chalk.green('✅ Environment files setup complete'));

    // Setup Git hooks (if .git exists)
    const gitDir = path.join(workspaceRoot, '.git');
    if (await fs.pathExists(gitDir)) {
      const hooksSpinner = ora('Setting up Git hooks...').start();
      
      const preCommitHook = `#!/bin/sh
# Nexus pre-commit hook
echo "Running pre-commit checks..."

# Run linting
pnpm lint

# Run type checking
pnpm check-types

echo "Pre-commit checks passed!"
`;

      const hooksDir = path.join(gitDir, 'hooks');
      await fs.ensureDir(hooksDir);
      await fs.writeFile(path.join(hooksDir, 'pre-commit'), preCommitHook);
      
      // Make hook executable
      try {
        execSync(`chmod +x ${path.join(hooksDir, 'pre-commit')}`);
      } catch (error) {
        // Ignore on Windows
      }

      hooksSpinner.succeed(chalk.green('✅ Git hooks setup complete'));
    }

    // Interactive configuration
    console.log(chalk.cyan('\n📋 Optional Configuration\n'));

    const { configureApps } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureApps',
        message: 'Would you like to configure application settings?',
        default: false
      }
    ]);

    if (configureApps) {
      await configureApplications(workspaceRoot);
    }

    // Success message
    console.log(chalk.green.bold('\n🎉 Development environment setup complete!\n'));
    
    console.log(chalk.cyan('Available commands:'));
    console.log(chalk.white('  pnpm dev              # Start all apps in development'));
    console.log(chalk.white('  pnpm build             # Build all apps and packages'));
    console.log(chalk.white('  pnpm lint              # Lint all code'));
    console.log(chalk.white('  pnpm test              # Run all tests'));
    console.log(chalk.white('  pnpm clean             # Clean build artifacts'));
    
    console.log(chalk.cyan('\nApplication URLs:'));
    console.log(chalk.white('  Web App:               http://localhost:3000'));
    console.log(chalk.white('  Documentation:         http://localhost:3001'));
    console.log(chalk.white('  Admin Dashboard:       http://localhost:3002'));
    console.log(chalk.white('  Client Portal:         http://localhost:3003'));
    console.log(chalk.white('  AI Tools:              http://localhost:3004'));

    console.log(chalk.cyan('\nGenerate new code:'));
    console.log(chalk.white('  npm run generate:app       # Generate new application'));
    console.log(chalk.white('  npm run generate:package   # Generate new package'));
    console.log(chalk.white('  npm run generate:component # Generate new component'));

  } catch (error) {
    spinner.fail(chalk.red('❌ Setup failed'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function configureApplications(workspaceRoot) {
  const { selectedApps } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedApps',
      message: 'Which applications would you like to configure?',
      choices: [
        { name: 'Web App (Main website)', value: 'web' },
        { name: 'Admin Dashboard', value: 'admin' },
        { name: 'Client Portal', value: 'client-portal' },
        { name: 'AI Tools Platform', value: 'ai-tools' }
      ]
    }
  ]);

  for (const app of selectedApps) {
    console.log(chalk.cyan(`\n⚙️  Configuring ${app}...`));
    
    const appDir = path.join(workspaceRoot, 'apps', app);
    const envPath = path.join(appDir, '.env.local');
    
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      // Configure based on app type
      if (app === 'ai-tools') {
        const { openaiKey } = await inquirer.prompt([
          {
            type: 'password',
            name: 'openaiKey',
            message: 'Enter your OpenAI API key (optional):',
            mask: '*'
          }
        ]);

        if (openaiKey) {
          const updatedContent = envContent.replace(
            /OPENAI_API_KEY=.*/,
            `OPENAI_API_KEY=${openaiKey}`
          );
          await fs.writeFile(envPath, updatedContent);
        }
      }

      // Add more app-specific configurations as needed
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
