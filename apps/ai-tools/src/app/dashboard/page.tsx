"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  FileText,
  Image,
  Code,
  BarChart3,
  MessageSquare,
  Mic,
  Languages,
  FileSearch,
  TrendingUp,
  Clock,
  Zap,
  Star,
  ArrowRight,
  Activity,
  Users,
  Cpu,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTools } from "@/contexts/tools-context";
import Link from "next/link";
import { formatNumber, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeTools, toolUsage } = useTools();

  // Mock data - replace with actual API calls
  const usageStats = {
    textGeneration: { used: 2500, limit: 10000 },
    imageGeneration: { used: 45, limit: 100 },
    codeAssistance: { used: 180, limit: 500 },
    dataAnalysis: { used: 12, limit: 100 },
    voiceSynthesis: { used: 1200, limit: 5000 },
    documentProcessing: { used: 25, limit: 100 },
    translation: { used: 8500, limit: 50000 },
    chatbotInteractions: { used: 320, limit: 1000 },
  };

  const recentActivity = [
    {
      id: '1',
      tool: 'Text Generator',
      action: 'Generated blog post',
      timestamp: '2024-06-25T10:30:00Z',
      status: 'success',
    },
    {
      id: '2',
      tool: 'Image Generator',
      action: 'Created product mockup',
      timestamp: '2024-06-25T09:15:00Z',
      status: 'success',
    },
    {
      id: '3',
      tool: 'Code Assistant',
      action: 'Optimized React component',
      timestamp: '2024-06-25T08:45:00Z',
      status: 'success',
    },
    {
      id: '4',
      tool: 'Data Analyzer',
      action: 'Analyzed sales data',
      timestamp: '2024-06-24T16:20:00Z',
      status: 'success',
    },
  ];

  const quickStats = [
    {
      title: "Tools Used Today",
      value: "6",
      change: "+2 from yesterday",
      icon: Cpu,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "API Calls",
      value: "1,247",
      change: "+18% this week",
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Processing Time",
      value: "1.2s",
      change: "avg response time",
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Success Rate",
      value: "99.8%",
      change: "last 30 days",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const favoriteTools = activeTools.slice(0, 4);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-blue-100 mt-1">
                You have {activeTools.length} AI tools at your disposal. Let's create something amazing today.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2 text-blue-100">
                <Brain className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.change}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Usage Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Usage Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/usage">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(usageStats).slice(0, 4).map(([key, stats]) => {
                  const percentage = (stats.used / stats.limit) * 100;
                  const toolName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{toolName}</span>
                        <span className="text-gray-500">
                          {formatNumber(stats.used)} / {formatNumber(stats.limit)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/activity">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.tool} • {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Success
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Tools */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Your Favorite Tools</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tools">
                Browse All Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteTools.map((tool) => {
                const iconMap: Record<string, any> = {
                  FileText,
                  Image,
                  Code,
                  BarChart3,
                  MessageSquare,
                  Mic,
                  Languages,
                  FileSearch,
                };
                const Icon = iconMap[tool.icon] || FileText;

                return (
                  <Link key={tool.id} href={`/tools/${tool.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {tool.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {tool.category}
                            </p>
                          </div>
                          {tool.isPremium && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>
              Jump into your most-used AI tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                <Link href="/tools/text-generator">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">Generate Text</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                <Link href="/tools/image-generator">
                  <Image className="h-6 w-6 mb-2" />
                  <span className="text-sm">Create Image</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                <Link href="/tools/code-assistant">
                  <Code className="h-6 w-6 mb-2" />
                  <span className="text-sm">Code Help</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                <Link href="/tools/data-analyzer">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Analyze Data</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
