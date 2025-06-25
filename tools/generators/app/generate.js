#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { Command } = require('commander');
const ora = require('ora');
const { execSync } = require('child_process');

const program = new Command();

program
  .name('generate-app')
  .description('Generate a new application in the Nexus workspace')
  .option('-n, --name <name>', 'Application name')
  .option('-t, --type <type>', 'Application type (nextjs, react-native, express)')
  .option('-p, --port <port>', 'Development port number')
  .option('--skip-install', 'Skip dependency installation')
  .parse();

const options = program.opts();

const APP_TYPES = {
  nextjs: {
    name: 'Next.js Application',
    description: 'React-based web application with SSR/SSG',
    defaultPort: 3000,
    template: 'nextjs'
  },
  'react-native': {
    name: 'React Native Application',
    description: 'Cross-platform mobile application',
    defaultPort: null,
    template: 'react-native'
  },
  express: {
    name: 'Express.js API',
    description: 'Node.js REST API server',
    defaultPort: 8000,
    template: 'express'
  },
  fastify: {
    name: 'Fastify API',
    description: 'High-performance Node.js API server',
    defaultPort: 8000,
    template: 'fastify'
  }
};

async function main() {
  console.log(chalk.blue.bold('🚀 Nexus App Generator\n'));

  let { name, type, port, skipInstall } = options;

  // Interactive prompts if options not provided
  if (!name || !type) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of your application?',
        when: !name,
        validate: (input) => {
          if (!input.trim()) return 'Application name is required';
          if (!/^[a-z0-9-]+$/.test(input)) return 'Use lowercase letters, numbers, and hyphens only';
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'What type of application do you want to create?',
        when: !type,
        choices: Object.entries(APP_TYPES).map(([key, config]) => ({
          name: `${config.name} - ${config.description}`,
          value: key
        }))
      },
      {
        type: 'input',
        name: 'port',
        message: 'What port should the app run on? (leave empty for default)',
        when: (answers) => {
          const appType = type || answers.type;
          return APP_TYPES[appType].defaultPort && !port;
        },
        validate: (input) => {
          if (!input) return true;
          const portNum = parseInt(input);
          if (isNaN(portNum) || portNum < 1000 || portNum > 65535) {
            return 'Port must be a number between 1000 and 65535';
          }
          return true;
        }
      }
    ]);

    name = name || answers.name;
    type = type || answers.type;
    port = port || answers.port;
  }

  const appConfig = APP_TYPES[type];
  if (!appConfig) {
    console.error(chalk.red(`❌ Unknown app type: ${type}`));
    process.exit(1);
  }

  const appDir = path.join(process.cwd(), '..', 'apps', name);
  const templateDir = path.join(__dirname, 'templates', appConfig.template);

  // Check if app already exists
  if (await fs.pathExists(appDir)) {
    console.error(chalk.red(`❌ Application '${name}' already exists`));
    process.exit(1);
  }

  const spinner = ora('Creating application...').start();

  try {
    // Create app directory
    await fs.ensureDir(appDir);

    // Copy template files
    if (await fs.pathExists(templateDir)) {
      await fs.copy(templateDir, appDir);
    } else {
      // Create basic structure if template doesn't exist
      await createBasicStructure(appDir, type, name, port || appConfig.defaultPort);
    }

    // Update package.json with app-specific details
    await updatePackageJson(appDir, name, type, port || appConfig.defaultPort);

    // Update workspace configuration
    await updateWorkspaceConfig(name);

    spinner.succeed(chalk.green(`✅ Created ${appConfig.name}: ${name}`));

    // Install dependencies
    if (!skipInstall) {
      const installSpinner = ora('Installing dependencies...').start();
      try {
        execSync('pnpm install', { cwd: path.join(process.cwd(), '..'), stdio: 'pipe' });
        installSpinner.succeed(chalk.green('✅ Dependencies installed'));
      } catch (error) {
        installSpinner.fail(chalk.yellow('⚠️  Failed to install dependencies. Run `pnpm install` manually.'));
      }
    }

    // Success message
    console.log(chalk.green.bold('\n🎉 Application created successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  cd apps/${name}`));
    if (!skipInstall) {
      console.log(chalk.white(`  pnpm dev`));
    } else {
      console.log(chalk.white(`  pnpm install`));
      console.log(chalk.white(`  pnpm dev`));
    }

    if (appConfig.defaultPort) {
      const finalPort = port || appConfig.defaultPort;
      console.log(chalk.white(`  Open http://localhost:${finalPort}\n`));
    }

  } catch (error) {
    spinner.fail(chalk.red('❌ Failed to create application'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function createBasicStructure(appDir, type, name, port) {
  const packageJson = {
    name: `@apps/${name}`,
    version: '0.1.0',
    private: true,
    scripts: {},
    dependencies: {},
    devDependencies: {}
  };

  switch (type) {
    case 'nextjs':
      packageJson.scripts = {
        build: 'next build',
        dev: `next dev --port ${port}`,
        lint: 'next lint --max-warnings 0',
        start: 'next start',
        'check-types': 'tsc --noEmit'
      };
      packageJson.dependencies = {
        '@nexus/ui': 'workspace:*',
        'next': '^15.3.0',
        'react': '^18.3.1',
        'react-dom': '^18.3.1'
      };
      packageJson.devDependencies = {
        '@nexus/eslint-config': 'workspace:*',
        '@nexus/typescript-config': 'workspace:*',
        '@types/node': '^22.10.1',
        '@types/react': '^18.3.12',
        '@types/react-dom': '^18.3.1',
        'eslint': '^8.57.1',
        'typescript': '5.8.2'
      };
      break;

    case 'express':
      packageJson.scripts = {
        build: 'tsc',
        dev: `nodemon --port ${port}`,
        start: 'node dist/index.js',
        lint: 'eslint src --ext .ts',
        'check-types': 'tsc --noEmit'
      };
      packageJson.dependencies = {
        'express': '^4.19.2',
        'cors': '^2.8.5',
        'helmet': '^7.1.0'
      };
      packageJson.devDependencies = {
        '@nexus/eslint-config': 'workspace:*',
        '@nexus/typescript-config': 'workspace:*',
        '@types/express': '^4.17.21',
        '@types/cors': '^2.8.17',
        '@types/node': '^22.10.1',
        'nodemon': '^3.1.7',
        'typescript': '5.8.2'
      };
      break;
  }

  await fs.writeJson(path.join(appDir, 'package.json'), packageJson, { spaces: 2 });

  // Create basic files
  if (type === 'nextjs') {
    await createNextJsFiles(appDir, name);
  } else if (type === 'express') {
    await createExpressFiles(appDir, name, port);
  }
}

async function createNextJsFiles(appDir, name) {
  // Create src/app structure
  await fs.ensureDir(path.join(appDir, 'src', 'app'));
  
  // page.tsx
  const pageContent = `export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ${name}
        </h1>
        <p className="text-gray-600">
          Your new Nexus application is ready!
        </p>
      </div>
    </div>
  );
}`;
  await fs.writeFile(path.join(appDir, 'src', 'app', 'page.tsx'), pageContent);

  // layout.tsx
  const layoutContent = `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "${name}",
  description: "Generated by Nexus App Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`;
  await fs.writeFile(path.join(appDir, 'src', 'app', 'layout.tsx'), layoutContent);

  // globals.css
  const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
  await fs.writeFile(path.join(appDir, 'src', 'app', 'globals.css'), cssContent);

  // next.config.js
  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/ui"],
};

module.exports = nextConfig;`;
  await fs.writeFile(path.join(appDir, 'next.config.js'), nextConfigContent);

  // tailwind.config.js
  const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  await fs.writeFile(path.join(appDir, 'tailwind.config.js'), tailwindConfigContent);

  // tsconfig.json
  const tsconfigContent = `{
  "extends": "@nexus/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`;
  await fs.writeFile(path.join(appDir, 'tsconfig.json'), tsconfigContent);
}

async function createExpressFiles(appDir, name, port) {
  await fs.ensureDir(path.join(appDir, 'src'));

  // index.ts
  const indexContent = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || ${port};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${name} API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${name} API running on port \${PORT}\`);
});`;
  await fs.writeFile(path.join(appDir, 'src', 'index.ts'), indexContent);

  // tsconfig.json
  const tsconfigContent = `{
  "extends": "@nexus/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;
  await fs.writeFile(path.join(appDir, 'tsconfig.json'), tsconfigContent);
}

async function updatePackageJson(appDir, name, type, port) {
  const packageJsonPath = path.join(appDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  // Update scripts with correct port
  if (type === 'nextjs' && port) {
    packageJson.scripts.dev = `next dev --port ${port}`;
  } else if (type === 'express' && port) {
    packageJson.scripts.dev = `nodemon --exec "ts-node src/index.ts" --watch src --ext ts --env-file .env`;
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function updateWorkspaceConfig(appName) {
  // This would update pnpm-workspace.yaml if needed
  // For now, apps/* pattern already covers new apps
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
