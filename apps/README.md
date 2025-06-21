# Microfrontend Architecture

This directory contains all the frontend applications using a microfrontend architecture pattern.

## Applications Overview

### Portal Applications
- **admin-portal**: Administrative dashboard for system management
- **employee-portal**: Internal employee workspace and tools
- **client-portal**: Client-facing project management and collaboration
- **developer-portal**: API documentation, sandbox, and developer tools

### Public Applications
- **marketing-website**: Public marketing site and blog
- **landing-pages**: Dynamic landing pages for campaigns

### Shared Applications
- **shell-app**: Main shell application that orchestrates microfrontends
- **shared-components**: Reusable UI components and design system

## Architecture Patterns

- **Module Federation**: Webpack 5 Module Federation for runtime composition
- **Micro-frontends**: Independent deployment and development
- **Shared Design System**: Consistent UI/UX across all applications
- **Event-driven Communication**: Cross-app communication via events
- **Centralized State Management**: Shared state for user authentication and global data

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Webpack 5 with Module Federation
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: Zustand for local state, React Query for server state
- **Routing**: React Router v6 with dynamic routing
- **Testing**: Jest + React Testing Library + Playwright
- **Documentation**: Storybook for component documentation

## Development

Each application follows the same structure:
```
app-name/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── stores/        # State management
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript types
├── public/
├── webpack.config.js  # Module Federation config
├── tailwind.config.js
└── package.json
```

## Module Federation

Each microfrontend exposes and consumes modules:

### Shell App (Host)
- Orchestrates all microfrontends
- Provides shared authentication
- Handles global navigation
- Manages shared state

### Portal Apps (Remotes)
- Expose specific page components
- Consume shared components
- Independent deployment
- Domain-specific functionality

## Shared Resources

- **Design System**: Shared UI components and tokens
- **Authentication**: Centralized auth state and services
- **API Client**: Shared HTTP client with interceptors
- **Event Bus**: Cross-app communication
- **Utilities**: Common helper functions

## Deployment

- Each app builds independently
- CDN deployment for static assets
- Environment-specific configurations
- Progressive loading and fallbacks
