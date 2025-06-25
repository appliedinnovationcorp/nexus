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
  .name('generate-package')
  .description('Generate a new package in the Nexus workspace')
  .option('-n, --name <name>', 'Package name (e.g., @nexus/my-package)')
  .option('-t, --type <type>', 'Package type (library, ui, config, utils)')
  .option('-d, --description <description>', 'Package description')
  .option('--skip-install', 'Skip dependency installation')
  .parse();

const options = program.opts();

const PACKAGE_TYPES = {
  library: {
    name: 'Library Package',
    description: 'General purpose library with utilities and helpers',
    template: 'library',
    dependencies: {},
    devDependencies: {
      '@nexus/typescript-config': 'workspace:*',
      'typescript': '5.8.2'
    }
  },
  ui: {
    name: 'UI Components Package',
    description: 'React components and UI elements',
    template: 'ui',
    dependencies: {
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
      'clsx': '^2.1.1'
    },
    devDependencies: {
      '@nexus/typescript-config': 'workspace:*',
      '@types/react': '^18.3.12',
      '@types/react-dom': '^18.3.1',
      'typescript': '5.8.2'
    }
  },
  config: {
    name: 'Configuration Package',
    description: 'Shared configuration files and settings',
    template: 'config',
    dependencies: {},
    devDependencies: {}
  },
  utils: {
    name: 'Utilities Package',
    description: 'Common utility functions and helpers',
    template: 'utils',
    dependencies: {
      'date-fns': '^4.1.0'
    },
    devDependencies: {
      '@nexus/typescript-config': 'workspace:*',
      '@types/node': '^22.10.1',
      'typescript': '5.8.2'
    }
  },
  domain: {
    name: 'Domain Package',
    description: 'Domain entities and business logic',
    template: 'domain',
    dependencies: {},
    devDependencies: {
      '@nexus/typescript-config': 'workspace:*',
      'typescript': '5.8.2'
    }
  },
  infrastructure: {
    name: 'Infrastructure Package',
    description: 'External services and infrastructure code',
    template: 'infrastructure',
    dependencies: {
      'axios': '^1.7.9'
    },
    devDependencies: {
      '@nexus/typescript-config': 'workspace:*',
      '@types/node': '^22.10.1',
      'typescript': '5.8.2'
    }
  }
};

async function main() {
  console.log(chalk.blue.bold('📦 Nexus Package Generator\n'));

  let { name, type, description, skipInstall } = options;

  // Interactive prompts if options not provided
  if (!name || !type) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of your package? (e.g., @nexus/my-package)',
        when: !name,
        validate: (input) => {
          if (!input.trim()) return 'Package name is required';
          if (!input.startsWith('@nexus/')) return 'Package name should start with @nexus/';
          if (!/^@nexus\/[a-z0-9-]+$/.test(input)) return 'Use lowercase letters, numbers, and hyphens only';
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'What type of package do you want to create?',
        when: !type,
        choices: Object.entries(PACKAGE_TYPES).map(([key, config]) => ({
          name: `${config.name} - ${config.description}`,
          value: key
        }))
      },
      {
        type: 'input',
        name: 'description',
        message: 'Package description:',
        when: !description
      }
    ]);

    name = name || answers.name;
    type = type || answers.type;
    description = description || answers.description;
  }

  const packageConfig = PACKAGE_TYPES[type];
  if (!packageConfig) {
    console.error(chalk.red(`❌ Unknown package type: ${type}`));
    process.exit(1);
  }

  // Extract package name without @nexus/ prefix
  const packageName = name.replace('@nexus/', '');
  const packageDir = path.join(process.cwd(), '..', 'packages', packageName);
  const templateDir = path.join(__dirname, 'templates', packageConfig.template);

  // Check if package already exists
  if (await fs.pathExists(packageDir)) {
    console.error(chalk.red(`❌ Package '${name}' already exists`));
    process.exit(1);
  }

  const spinner = ora('Creating package...').start();

  try {
    // Create package directory
    await fs.ensureDir(packageDir);

    // Copy template files if they exist
    if (await fs.pathExists(templateDir)) {
      await fs.copy(templateDir, packageDir);
    } else {
      // Create basic structure
      await createBasicStructure(packageDir, type, name, description, packageConfig);
    }

    // Update package.json with package-specific details
    await updatePackageJson(packageDir, name, description, packageConfig);

    spinner.succeed(chalk.green(`✅ Created ${packageConfig.name}: ${name}`));

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
    console.log(chalk.green.bold('\n🎉 Package created successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  cd packages/${packageName}`));
    console.log(chalk.white(`  # Start developing your package`));
    console.log(chalk.white(`  # Import in apps: import { ... } from '${name}'`));

  } catch (error) {
    spinner.fail(chalk.red('❌ Failed to create package'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function createBasicStructure(packageDir, type, name, description, config) {
  // Create src directory
  await fs.ensureDir(path.join(packageDir, 'src'));

  // Create package.json
  const packageJson = {
    name,
    version: '0.1.0',
    description: description || config.description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    files: ['dist'],
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
      clean: 'rm -rf dist',
      'check-types': 'tsc --noEmit'
    },
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    peerDependencies: {},
    keywords: ['nexus', type, 'typescript'],
    repository: {
      type: 'git',
      url: 'https://github.com/your-org/nexus.git',
      directory: `packages/${name.replace('@nexus/', '')}`
    }
  };

  // Add peer dependencies for UI packages
  if (type === 'ui') {
    packageJson.peerDependencies = {
      react: '^18.3.1',
      'react-dom': '^18.3.1'
    };
  }

  await fs.writeJson(path.join(packageDir, 'package.json'), packageJson, { spaces: 2 });

  // Create TypeScript config
  const tsConfig = {
    extends: '@nexus/typescript-config/base.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      declarationMap: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.*', '**/*.spec.*']
  };

  await fs.writeJson(path.join(packageDir, 'tsconfig.json'), tsConfig, { spaces: 2 });

  // Create main index file based on type
  await createIndexFile(packageDir, type, name);

  // Create README
  await createReadme(packageDir, name, description || config.description, type);

  // Create additional files based on type
  if (type === 'ui') {
    await createUIFiles(packageDir);
  } else if (type === 'utils') {
    await createUtilsFiles(packageDir);
  } else if (type === 'domain') {
    await createDomainFiles(packageDir);
  }
}

async function createIndexFile(packageDir, type, name) {
  let content = '';

  switch (type) {
    case 'library':
      content = `/**
 * ${name}
 * 
 * A general purpose library package for the Nexus workspace.
 */

export * from './lib';
export * from './types';

// Default export
export { default } from './lib';
`;
      break;

    case 'ui':
      content = `/**
 * ${name}
 * 
 * UI components package for the Nexus workspace.
 */

export * from './components';
export * from './types';
export * from './utils';
`;
      break;

    case 'utils':
      content = `/**
 * ${name}
 * 
 * Utility functions package for the Nexus workspace.
 */

export * from './formatters';
export * from './validators';
export * from './helpers';
export * from './types';
`;
      break;

    case 'domain':
      content = `/**
 * ${name}
 * 
 * Domain entities and business logic for the Nexus workspace.
 */

export * from './entities';
export * from './value-objects';
export * from './services';
export * from './events';
export * from './types';
`;
      break;

    case 'config':
      content = `/**
 * ${name}
 * 
 * Configuration package for the Nexus workspace.
 */

export * from './eslint';
export * from './typescript';
export * from './tailwind';
`;
      break;

    default:
      content = `/**
 * ${name}
 */

export const version = '0.1.0';

export default {
  version
};
`;
  }

  await fs.writeFile(path.join(packageDir, 'src', 'index.ts'), content);
}

async function createUIFiles(packageDir) {
  const srcDir = path.join(packageDir, 'src');
  
  // Create components directory
  await fs.ensureDir(path.join(srcDir, 'components'));
  
  // Create a sample Button component
  const buttonComponent = `import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
`;

  await fs.writeFile(path.join(srcDir, 'components', 'Button.tsx'), buttonComponent);

  // Create components index
  const componentsIndex = `export { Button, type ButtonProps } from './Button';
`;
  await fs.writeFile(path.join(srcDir, 'components', 'index.ts'), componentsIndex);

  // Create types file
  const typesContent = `export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}
`;
  await fs.writeFile(path.join(srcDir, 'types.ts'), typesContent);

  // Create utils file
  const utilsContent = `import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
`;
  await fs.writeFile(path.join(srcDir, 'utils.ts'), utilsContent);
}

async function createUtilsFiles(packageDir) {
  const srcDir = path.join(packageDir, 'src');

  // Create formatters
  const formattersContent = `import { format } from 'date-fns';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, pattern = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
`;
  await fs.writeFile(path.join(srcDir, 'formatters.ts'), formattersContent);

  // Create validators
  const validatorsContent = `export function isEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

export function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
`;
  await fs.writeFile(path.join(srcDir, 'validators.ts'), validatorsContent);

  // Create helpers
  const helpersContent = `export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
`;
  await fs.writeFile(path.join(srcDir, 'helpers.ts'), helpersContent);

  // Create types
  const typesContent = `export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
`;
  await fs.writeFile(path.join(srcDir, 'types.ts'), typesContent);
}

async function createDomainFiles(packageDir) {
  const srcDir = path.join(packageDir, 'src');

  // Create directories
  await fs.ensureDir(path.join(srcDir, 'entities'));
  await fs.ensureDir(path.join(srcDir, 'value-objects'));
  await fs.ensureDir(path.join(srcDir, 'services'));
  await fs.ensureDir(path.join(srcDir, 'events'));

  // Create sample entity
  const entityContent = `export abstract class Entity<T> {
  protected readonly _id: T;
  
  constructor(id: T) {
    this._id = id;
  }
  
  get id(): T {
    return this._id;
  }
  
  equals(entity: Entity<T>): boolean {
    return this._id === entity._id;
  }
}

export class User extends Entity<string> {
  constructor(
    id: string,
    public readonly email: string,
    public readonly name: string
  ) {
    super(id);
  }
}
`;
  await fs.writeFile(path.join(srcDir, 'entities', 'index.ts'), entityContent);

  // Create sample value object
  const valueObjectContent = `export abstract class ValueObject<T> {
  protected readonly _value: T;
  
  constructor(value: T) {
    this._value = value;
  }
  
  get value(): T {
    return this._value;
  }
  
  equals(vo: ValueObject<T>): boolean {
    return JSON.stringify(this._value) === JSON.stringify(vo._value);
  }
}

export class Email extends ValueObject<string> {
  constructor(email: string) {
    if (!Email.isValid(email)) {
      throw new Error('Invalid email format');
    }
    super(email);
  }
  
  static isValid(email: string): boolean {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  }
}
`;
  await fs.writeFile(path.join(srcDir, 'value-objects', 'index.ts'), valueObjectContent);

  // Create sample service
  const serviceContent = `export interface DomainService {
  // Domain service interface
}

export class UserService implements DomainService {
  // Domain service implementation
}
`;
  await fs.writeFile(path.join(srcDir, 'services', 'index.ts'), serviceContent);

  // Create sample events
  const eventsContent = `export interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventName: string;
}

export class UserCreatedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'UserCreated';
  
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    this.occurredOn = new Date();
  }
}
`;
  await fs.writeFile(path.join(srcDir, 'events', 'index.ts'), eventsContent);

  // Create types
  const typesContent = `export interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
`;
  await fs.writeFile(path.join(srcDir, 'types.ts'), typesContent);
}

async function createReadme(packageDir, name, description, type) {
  const packageName = name.replace('@nexus/', '');
  
  const readmeContent = `# ${name}

${description}

## Installation

\`\`\`bash
pnpm add ${name}
\`\`\`

## Usage

\`\`\`typescript
import { ... } from '${name}';

// Your code here
\`\`\`

## API Reference

### Functions

<!-- Document your functions here -->

### Types

<!-- Document your types here -->

## Development

\`\`\`bash
# Build the package
pnpm build

# Watch for changes
pnpm dev

# Type check
pnpm check-types
\`\`\`

## Contributing

1. Make your changes
2. Add tests if applicable
3. Run \`pnpm build\` to ensure it builds
4. Submit a pull request

## License

MIT
`;

  await fs.writeFile(path.join(packageDir, 'README.md'), readmeContent);
}

async function updatePackageJson(packageDir, name, description, config) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Update with provided values
    if (description) {
      packageJson.description = description;
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
