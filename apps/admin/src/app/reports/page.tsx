"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  FolderOpen, 
  DollarSign,
  Activity,
  Download,
  Calendar,
  Play,
  Settings
} from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Mock analytics data
  const metrics = [
    {
      title: "Total Users",
      value: "2,847",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Projects",
      value: "423",
      change: "+8.2%",
      changeType: "increase" as const,
      icon: FolderOpen,
      color: "text-green-600",
    },
    {
      title: "Content Views",
      value: "45.2K",
      change: "-2.1%",
      changeType: "decrease" as const,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Revenue",
      value: "$89,432",
      change: "+15.3%",
      changeType: "increase" as const,
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  const reports = [
    {
      id: "1",
      name: "User Activity Report",
      description: "Daily active users and engagement metrics",
      type: "user-analytics",
      frequency: "daily",
      lastRun: "2024-06-21T06:00:00Z",
      status: "active",
    },
    {
      id: "2",
      name: "Content Performance",
      description: "Content views, engagement, and top performing articles",
      type: "content-performance",
      frequency: "weekly",
      lastRun: "2024-06-17T08:00:00Z",
      status: "active",
    },
    {
      id: "3",
      name: "Project Status Summary",
      description: "Overview of all projects, milestones, and deadlines",
      type: "project-status",
      frequency: "weekly",
      lastRun: "2024-06-17T10:00:00Z",
      status: "active",
    },
    {
      id: "4",
      name: "Financial Summary",
      description: "Revenue, expenses, and financial KPIs",
      type: "financial",
      frequency: "monthly",
      lastRun: "2024-06-01T09:00:00Z",
      status: "active",
    },
    {
      id: "5",
      name: "System Health Check",
      description: "Server performance, uptime, and error rates",
      type: "system-health",
      frequency: "real-time",
      lastRun: "2024-06-21T18:00:00Z",
      status: "active",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor performance, track metrics, and generate insights
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Time Period:</span>
        {["7d", "30d", "90d", "1y"].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === "7d" && "7 Days"}
            {period === "30d" && "30 Days"}
            {period === "90d" && "90 Days"}
            {period === "1y" && "1 Year"}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isIncrease = metric.changeType === "increase";
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <p className={`text-xs flex items-center mt-1 ${
                  isIncrease ? "text-green-600" : "text-red-600"
                }`}>
                  {isIncrease ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change} from last period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              User Growth
            </CardTitle>
            <CardDescription>
              New user registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Integration with Chart.js or similar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>
              Response times and uptime metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Real-time performance chart</p>
                <p className="text-sm">Live system metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Automated reports and their execution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 capitalize">{report.frequency}</p>
                    <p className="text-xs text-gray-500">
                      Last run: {new Date(report.lastRun).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {report.status}
                    </span>
                    
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>
            Generate instant reports for immediate insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "User Activity (Last 7 Days)", icon: Users, color: "bg-blue-500" },
              { name: "Content Performance", icon: FileText, color: "bg-green-500" },
              { name: "Project Status Overview", icon: FolderOpen, color: "bg-purple-500" },
            ].map((quickReport) => {
              const Icon = quickReport.icon;
              return (
                <Button
                  key={quickReport.name}
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm text-center">{quickReport.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
