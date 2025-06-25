#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const program = new Command();

program
  .name('nexus')
  .description('Nexus workspace CLI tool')
  .version('1.0.0');

// Generate commands
program
  .command('generate')
  .alias('g')
  .description('Generate new code')
  .argument('<type>', 'Type to generate (app, package, component, service, api)')
  .option('-n, --name <name>', 'Name of the item to generate')
  .option('-t, --type <type>', 'Specific type/template to use')
  .action(async (type, options) => {
    const generatorPath = path.join(__dirname, '..', '..', 'generators', type, 'generate.js');
    
    if (!await fs.pathExists(generatorPath)) {
      console.error(chalk.red(`❌ Generator for '${type}' not found`));
      process.exit(1);
    }

    try {
      const args = [];
      if (options.name) args.push('--name', options.name);
      if (options.type) args.push('--type', options.type);
      
      execSync(`node ${generatorPath} ${args.join(' ')}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Generation failed'));
      process.exit(1);
    }
  });

// Development commands
program
  .command('dev')
  .description('Start development servers')
  .option('-a, --app <app>', 'Start specific app only')
  .option('-p, --port <port>', 'Override port number')
  .action(async (options) => {
    const workspaceRoot = path.join(__dirname, '..', '..', '..');
    
    try {
      if (options.app) {
        console.log(chalk.blue(`🚀 Starting ${options.app} in development mode...`));
        const portFlag = options.port ? `--port ${options.port}` : '';
        execSync(`pnpm dev --filter @apps/${options.app} ${portFlag}`, { 
          cwd: workspaceRoot, 
          stdio: 'inherit' 
        });
      } else {
        console.log(chalk.blue('🚀 Starting all apps in development mode...'));
        execSync('pnpm dev', { cwd: workspaceRoot, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to start development servers'));
      process.exit(1);
    }
  });

// Build commands
program
  .command('build')
  .description('Build applications and packages')
  .option('-a, --app <app>', 'Build specific app only')
  .option('-p, --packages', 'Build packages only')
  .action(async (options) => {
    const workspaceRoot = path.join(__dirname, '..', '..', '..');
    
    try {
      if (options.app) {
        console.log(chalk.blue(`🔨 Building ${options.app}...`));
        execSync(`pnpm build --filter @apps/${options.app}`, { 
          cwd: workspaceRoot, 
          stdio: 'inherit' 
        });
      } else if (options.packages) {
        console.log(chalk.blue('🔨 Building packages...'));
        execSync('pnpm build --filter "./packages/*"', { 
          cwd: workspaceRoot, 
          stdio: 'inherit' 
        });
      } else {
        console.log(chalk.blue('🔨 Building all apps and packages...'));
        execSync('pnpm build', { cwd: workspaceRoot, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Build failed'));
      process.exit(1);
    }
  });

// Lint commands
program
  .command('lint')
  .description('Lint code')
  .option('-a, --app <app>', 'Lint specific app only')
  .option('--fix', 'Auto-fix linting issues')
  .action(async (options) => {
    const workspaceRoot = path.join(__dirname, '..', '..', '..');
    
    try {
      const fixFlag = options.fix ? '--fix' : '';
      
      if (options.app) {
        console.log(chalk.blue(`🔍 Linting ${options.app}...`));
        execSync(`pnpm lint --filter @apps/${options.app} ${fixFlag}`, { 
          cwd: workspaceRoot, 
          stdio: 'inherit' 
        });
      } else {
        console.log(chalk.blue('🔍 Linting all code...'));
        execSync(`pnpm lint ${fixFlag}`, { cwd: workspaceRoot, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Linting failed'));
      process.exit(1);
    }
  });

// Test commands
program
  .command('test')
  .description('Run tests')
  .option('-a, --app <app>', 'Test specific app only')
  .option('-w, --watch', 'Watch mode')
  .option('--coverage', 'Generate coverage report')
  .action(async (options) => {
    const workspaceRoot = path.join(__dirname, '..', '..', '..');
    
    try {
      const flags = [];
      if (options.watch) flags.push('--watch');
      if (options.coverage) flags.push('--coverage');
      
      if (options.app) {
        console.log(chalk.blue(`🧪 Testing ${options.app}...`));
        execSync(`pnpm test --filter @apps/${options.app} ${flags.join(' ')}`, { 
          cwd: workspaceRoot, 
          stdio: 'inherit' 
        });
      } else {
        console.log(chalk.blue('🧪 Running all tests...'));
        execSync(`pnpm test ${flags.join(' ')}`, { cwd: workspaceRoot, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Tests failed'));
      process.exit(1);
    }
  });

// Clean commands
program
  .command('clean')
  .description('Clean build artifacts')
  .option('--all', 'Clean everything including node_modules')
  .action(async (options) => {
    const workspaceRoot = path.join(__dirname, '..', '..', '..');
    
    try {
      if (options.all) {
        console.log(chalk.blue('🧹 Cleaning everything...'));
        execSync('pnpm clean:all', { cwd: workspaceRoot, stdio: 'inherit' });
      } else {
        console.log(chalk.blue('🧹 Cleaning build artifacts...'));
        execSync('pnpm clean', { cwd: workspaceRoot, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Clean failed'));
      process.exit(1);
    }
  });

// Info commands
program
  .command('info')
  .description('Show workspace information')
  .action(async () => {
    const workspaceRoot = path.join(__dirname, '..', '..', '..');
    
    try {
      console.log(chalk.blue.bold('📊 Nexus Workspace Information\n'));
      
      // Show workspace structure
      const apps = await fs.readdir(path.join(workspaceRoot, 'apps'));
      const packages = await fs.readdir(path.join(workspaceRoot, 'packages'));
      const services = await fs.readdir(path.join(workspaceRoot, 'services'));
      
      console.log(chalk.cyan('Applications:'));
      apps.forEach(app => console.log(chalk.white(`  • ${app}`)));
      
      console.log(chalk.cyan('\nPackages:'));
      packages.forEach(pkg => console.log(chalk.white(`  • @nexus/${pkg}`)));
      
      console.log(chalk.cyan('\nServices:'));
      services.forEach(service => console.log(chalk.white(`  • ${service}`)));
      
      // Show package.json info
      const rootPackage = await fs.readJson(path.join(workspaceRoot, 'package.json'));
      console.log(chalk.cyan('\nWorkspace:'));
      console.log(chalk.white(`  • Name: ${rootPackage.name}`));
      console.log(chalk.white(`  • Version: ${rootPackage.version}`));
      
      // Show Node.js and pnpm versions
      console.log(chalk.cyan('\nEnvironment:'));
      console.log(chalk.white(`  • Node.js: ${process.version}`));
      
      try {
        const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
        console.log(chalk.white(`  • pnpm: v${pnpmVersion}`));
      } catch (error) {
        console.log(chalk.white('  • pnpm: not installed'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to get workspace info'));
      process.exit(1);
    }
  });

// Setup command
program
  .command('setup')
  .description('Setup development environment')
  .action(async () => {
    const setupScript = path.join(__dirname, '..', '..', 'scripts', 'setup-dev-environment.js');
    
    try {
      execSync(`node ${setupScript}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Setup failed'));
      process.exit(1);
    }
  });

// Deploy commands
program
  .command('deploy')
  .description('Deploy applications')
  .argument('<environment>', 'Environment to deploy to (staging, production)')
  .option('-a, --app <app>', 'Deploy specific app only')
  .action(async (environment, options) => {
    const deployScript = path.join(__dirname, '..', '..', 'scripts', 'deploy', `${environment}.js`);
    
    if (!await fs.pathExists(deployScript)) {
      console.error(chalk.red(`❌ Deploy script for '${environment}' not found`));
      process.exit(1);
    }

    try {
      const args = options.app ? `--app ${options.app}` : '';
      execSync(`node ${deployScript} ${args}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Deployment failed'));
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Run `nexus --help` for available commands'));
  process.exit(1);
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
