'use client';

import Link from "next/link";
import { 
  Database, 
  Shield, 
  Zap, 
  HardDrive, 
  Users, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Code,
  Layers,
  Settings
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Authentication & Security",
    description: "Multi-provider auth, MFA, row-level security policies",
    items: ["OAuth (Google, GitHub)", "SMS & Email 2FA", "JWT Management", "RBAC System"]
  },
  {
    icon: Database,
    title: "Database Management",
    description: "Visual database interface with auto-generated APIs",
    items: ["Airtable-like Interface", "SQL Editor", "REST & GraphQL APIs", "Real-time Sync"]
  },
  {
    icon: HardDrive,
    title: "File Storage",
    description: "Scalable storage with image transformations",
    items: ["Multi-bucket Storage", "Image Processing", "CDN Ready", "S3 Compatible"]
  },
  {
    icon: Zap,
    title: "Edge Functions",
    description: "Deploy serverless functions globally",
    items: ["Deno Runtime", "Regional Deployment", "NPM Modules", "Real-time Logs"]
  },
  {
    icon: Users,
    title: "User Management",
    description: "Complete user lifecycle management",
    items: ["User CRUD", "Organization Support", "Role Management", "Activity Tracking"]
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Custom dashboards and automated reporting",
    items: ["Real-time Metrics", "Custom Charts", "Scheduled Reports", "SQL Queries"]
  }
];

const stats = [
  { label: "API Endpoints", value: "200+" },
  { label: "Built-in Features", value: "200+" },
  { label: "Auth Providers", value: "6+" },
  { label: "Deploy Time", value: "<5min" }
];

const architectureLayers = [
  {
    name: "Domain Core",
    description: "Entities, Value Objects, Domain Services, Events",
    color: "bg-blue-500",
    icon: Layers
  },
  {
    name: "Application",
    description: "Use Cases, Ports (Interfaces), DTOs",
    color: "bg-green-500",
    icon: Code
  },
  {
    name: "Infrastructure",
    description: "Database, External Services, Adapters",
    color: "bg-orange-500",
    icon: Database
  },
  {
    name: "Presentation",
    description: "API Routes, UI Components, Controllers",
    color: "bg-purple-500",
    icon: Settings
  }
];

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Nexus Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                Admin Dashboard
              </a>
              <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                Documentation
              </a>
              <a 
                href="http://localhost:3002" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Production-Ready Backend-as-a-Service
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Build faster with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Nexus Platform
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Complete Backend-as-a-Service platform with authentication, database management, 
              storage, serverless functions, and comprehensive admin tools. Deploy in minutes, scale to millions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a 
              href="http://localhost:3002" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Launch Admin Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a 
              href="http://localhost:3001" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
            >
              View Documentation
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to build modern applications
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From authentication to analytics, we&apos;ve got you covered with enterprise-grade features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built with Hexagonal Architecture
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Clean, maintainable, and testable code structure following Domain-Driven Design principles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {architectureLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.name} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className={`w-16 h-16 ${layer.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{layer.name}</h3>
                  <p className="text-sm text-gray-600">{layer.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build your next project?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get started with Nexus Platform today and ship faster than ever before
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="http://localhost:3002" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              Access Admin Dashboard
              <Globe className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Nexus Platform</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Complete Backend-as-a-Service platform for modern applications. 
                Built with enterprise-grade security and scalability in mind.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="http://localhost:3002" target="_blank" rel="noopener noreferrer" className="hover:text-white">Admin Dashboard</a></li>
                <li><a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Status Page</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Getting Started</a></li>
                <li><a href="#" className="hover:text-white">Tutorials</a></li>
                <li><a href="#" className="hover:text-white">Examples</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Nexus Platform. Built with Next.js, TypeScript, and Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
