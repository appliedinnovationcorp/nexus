"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Brain, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Sparkles,
  Cpu,
  Database,
  Code,
  Image,
  FileText,
  BarChart3,
  MessageSquare,
  Mic,
  Languages,
  FileSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileText,
    title: "AI Text Generator",
    description: "Generate high-quality content, articles, and copy with advanced AI",
    category: "Content",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Image,
    title: "AI Image Generator",
    description: "Create stunning images from text descriptions using DALL-E",
    category: "Creative",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Code,
    title: "Code Assistant",
    description: "Get help with coding, debugging, and optimization",
    category: "Development",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: BarChart3,
    title: "Data Analyzer",
    description: "Analyze and visualize your data with AI-powered insights",
    category: "Analytics",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    icon: MessageSquare,
    title: "Chatbot Builder",
    description: "Build intelligent chatbots for your business",
    category: "Automation",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    icon: Mic,
    title: "Voice Synthesizer",
    description: "Convert text to natural-sounding speech",
    category: "Audio",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    icon: FileSearch,
    title: "Document Processor",
    description: "Extract and process information from documents",
    category: "Productivity",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  {
    icon: Languages,
    title: "Translation Engine",
    description: "Translate text between 100+ languages instantly",
    category: "Language",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
];

const stats = [
  { label: "AI Tools", value: "8+", icon: Cpu },
  { label: "Active Users", value: "10K+", icon: Users },
  { label: "API Calls", value: "1M+", icon: Database },
  { label: "Uptime", value: "99.9%", icon: TrendingUp }
];

const benefits = [
  "No setup required - start using immediately",
  "Enterprise-grade security and privacy",
  "Scalable infrastructure for any workload",
  "24/7 support and comprehensive documentation",
  "Regular updates with latest AI models",
  "Flexible pricing for individuals and teams"
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Nexus AI Tools</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/tools" className="text-gray-600 hover:text-gray-900">
                Tools
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/docs" className="text-gray-600 hover:text-gray-900">
                Docs
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 neural-bg">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Powered by Latest AI Models
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Comprehensive
              <span className="gradient-text block">
                AI Tools Platform
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Access a complete suite of AI-powered tools for content generation, data analysis, 
              automation, and more. Built for businesses, developers, and creators.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Explore Tools
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm mb-2">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful AI Tools for Every Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From content creation to data analysis, our comprehensive suite of AI tools 
              helps you work smarter and faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow ai-tool-card">
                    <CardHeader>
                      <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <Badge variant="secondary" className="w-fit mb-2">
                        {feature.category}
                      </Badge>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Nexus AI Tools?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built for professionals who demand reliability, security, and performance. 
                Our platform provides enterprise-grade AI tools with simple, transparent pricing.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Lightning Fast</h3>
                    <p className="text-blue-100">Average response time under 2 seconds</p>
                  </div>
                </div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Enterprise Security</h3>
                    <p className="text-blue-100">SOC 2 compliant with end-to-end encryption</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Global Scale</h3>
                    <p className="text-blue-100">Available worldwide with 99.9% uptime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals using Nexus AI Tools to work smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Free Trial
                <Star className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Nexus AI Tools</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Comprehensive AI-powered tools platform for businesses, developers, and creators. 
                Built with enterprise-grade security and scalability.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/tools" className="hover:text-white">All Tools</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/tutorials" className="hover:text-white">Tutorials</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Nexus AI Tools. Built with Next.js, TypeScript, and the latest AI models.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
