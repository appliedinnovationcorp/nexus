# AIC Mobile Applications

Cross-platform mobile applications for Applied Innovation Corporation's B2B platform, built with React Native and Expo.

## Applications

### **AIC Consultant** - Employee Mobile App
- Project management on-the-go
- Client communication and updates
- Time tracking and expense reporting
- AI assessment tools
- Document access and sharing

### **AIC Client** - Client Mobile App
- Project progress monitoring
- Team communication
- Document review and approval
- Invoice and payment tracking
- Support ticket management

### **AIC Admin** - Administrative Mobile App
- System monitoring and alerts
- User and organization management
- Revenue and analytics dashboard
- Emergency response tools
- Notification management

## Technology Stack

- **Framework**: React Native with Expo
- **State Management**: Zustand + React Query
- **Navigation**: React Navigation v6
- **UI Components**: NativeBase + Custom Design System
- **Authentication**: JWT with biometric support
- **Offline Support**: React Query with persistence
- **Push Notifications**: Expo Notifications
- **Analytics**: Expo Analytics + Custom tracking
- **Testing**: Jest + Detox for E2E

## Features

### Core Features
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint
- **Offline-First**: Works without internet connection
- **Real-time Sync**: Automatic data synchronization
- **Push Notifications**: Smart notification management
- **Dark Mode**: Automatic theme switching
- **Accessibility**: Full accessibility support

### Business Features
- **AI Assessment Tools**: Mobile-optimized assessment forms
- **Project Kanban**: Touch-friendly task management
- **Client Portal**: Mobile-first client experience
- **Time Tracking**: GPS-enabled time tracking
- **Document Scanner**: AI-powered document scanning
- **Voice Notes**: Speech-to-text integration

## Architecture

### Shared Components
```
mobile/
├── shared/
│   ├── components/     # Reusable UI components
│   ├── services/       # API services
│   ├── stores/         # Global state management
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript definitions
├── consultant-app/     # Employee mobile app
├── client-app/         # Client mobile app
├── admin-app/          # Admin mobile app
└── design-system/      # Shared design tokens
```

### State Management
- **Global State**: Authentication, user preferences, offline queue
- **Local State**: Screen-specific data and UI state
- **Cache Management**: Intelligent data caching and invalidation
- **Offline Queue**: Action queuing for offline scenarios

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) / Android Emulator
- Physical devices for testing

### Setup
```bash
# Install dependencies
cd mobile
npm install

# Start development server
npm run start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building
```bash
# Build for development
expo build:ios --type simulator
expo build:android --type apk

# Build for production
expo build:ios --type archive
expo build:android --type app-bundle
```

## Deployment

### App Store Distribution
- **iOS**: App Store Connect with TestFlight
- **Android**: Google Play Console with Internal Testing
- **Enterprise**: Over-the-air (OTA) updates with Expo

### CI/CD Pipeline
- **Automated Testing**: Unit and E2E tests on PR
- **Build Automation**: Automatic builds on merge
- **Distribution**: Automatic deployment to test environments
- **Release Management**: Staged rollouts with monitoring

## Security

### Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **Secure Storage**: Keychain (iOS) / Keystore (Android)
- **Certificate Pinning**: API communication security
- **Biometric Authentication**: Device-level security

### Compliance
- **GDPR**: Data portability and deletion
- **SOC 2**: Security controls implementation
- **Industry Standards**: Compliance with client requirements
