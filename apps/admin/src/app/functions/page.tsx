"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Play, 
  Pause, 
  Code, 
  Globe, 
  Activity, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Users,
  Radio
} from "lucide-react";

export default function FunctionsPage() {
  const [activeTab, setActiveTab] = useState("functions");

  // Mock data
  const edgeFunctions = [
    {
      id: "1",
      name: "user-auth",
      description: "Handle user authentication and JWT validation",
      status: "active",
      runtime: "deno",
      region: "global",
      invocations: 15420,
      avgDuration: "45ms",
      lastDeployed: "2024-06-21T10:30:00Z",
      size: "2.1 KB",
    },
    {
      id: "2", 
      name: "image-resize",
      description: "Resize and optimize images on-the-fly",
      status: "active",
      runtime: "deno",
      region: "us-east-1",
      invocations: 8934,
      avgDuration: "120ms", 
      lastDeployed: "2024-06-20T15:45:00Z",
      size: "5.7 KB",
    },
    {
      id: "3",
      name: "webhook-handler",
      description: "Process incoming webhooks from external services",
      status: "inactive",
      runtime: "deno",
      region: "eu-west-1",
      invocations: 234,
      avgDuration: "78ms",
      lastDeployed: "2024-06-18T09:15:00Z", 
      size: "3.4 KB",
    },
  ];

  const realtimeChannels = [
    {
      id: "1",
      name: "project-updates",
      type: "broadcast",
      subscribers: 45,
      messagesPerHour: 234,
      status: "active",
      description: "Real-time project status updates",
    },
    {
      id: "2",
      name: "user-presence", 
      type: "presence",
      subscribers: 128,
      messagesPerHour: 1567,
      status: "active",
      description: "Track online users and their status",
    },
    {
      id: "3",
      name: "chat-room",
      type: "broadcast",
      subscribers: 23,
      messagesPerHour: 89,
      status: "active", 
      description: "Team chat and messaging",
    },
  ];

  const tabs = [
    { id: "functions", name: "Edge Functions", icon: Zap },
    { id: "realtime", name: "Realtime", icon: Radio },
    { id: "logs", name: "Logs", icon: Activity },
  ];

  const renderFunctions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Edge Functions</h2>
          <p className="text-gray-600 mt-1">Deploy and manage serverless functions at the edge</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Deploy
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Function
          </Button>
        </div>
      </div>

      {/* Functions List */}
      <div className="space-y-4">
        {edgeFunctions.map((func) => (
          <Card key={func.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{func.name}</h3>
                    <p className="text-sm text-gray-500">{func.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                      <span>Runtime: {func.runtime}</span>
                      <span>Region: {func.region}</span>
                      <span>Size: {func.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {func.invocations.toLocaleString()} invocations
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {func.avgDuration}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      func.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {func.status}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Function Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Function Editor
          </CardTitle>
          <CardDescription>
            Write and deploy Deno-based Edge Functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Function Name
                </label>
                <input
                  type="text"
                  placeholder="my-function"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Runtime
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="deno">Deno</option>
                  <option value="node">Node.js</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Function Code
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
                  <span className="text-sm font-medium">index.ts</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <textarea
                  rows={12}
                  className="w-full p-4 font-mono text-sm resize-none focus:outline-none"
                  defaultValue={`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  const { method, url } = req;
  
  // Handle CORS
  if (method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Your function logic here
    const data = { message: 'Hello from Edge Function!', timestamp: new Date().toISOString() };
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});`}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Test Function
              </Button>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Deploy Function
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRealtime = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Realtime Channels</h2>
          <p className="text-gray-600 mt-1">Manage real-time subscriptions and broadcasts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Channel
        </Button>
      </div>

      {/* Realtime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Channels", value: "12", color: "text-blue-600" },
          { label: "Total Subscribers", value: "196", color: "text-green-600" },
          { label: "Messages/Hour", value: "1.9K", color: "text-purple-600" },
          { label: "Peak Concurrent", value: "89", color: "text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channels List */}
      <div className="space-y-4">
        {realtimeChannels.map((channel) => (
          <Card key={channel.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Radio className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{channel.name}</h3>
                    <p className="text-sm text-gray-500">{channel.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                      <span>Type: {channel.type}</span>
                      <span>Subscribers: {channel.subscribers}</span>
                      <span>Messages/hr: {channel.messagesPerHour}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{channel.subscribers}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {channel.messagesPerHour} msg/hr
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      channel.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {channel.status}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Pause className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Realtime Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Realtime Configuration</CardTitle>
          <CardDescription>
            Configure real-time database subscriptions and broadcasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Database Changes</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="enable-realtime" defaultChecked className="rounded" />
                  <label htmlFor="enable-realtime" className="text-sm font-medium">
                    Enable realtime subscriptions
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="row-level-security" defaultChecked className="rounded" />
                  <label htmlFor="row-level-security" className="text-sm font-medium">
                    Apply row-level security to subscriptions
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="presence-tracking" defaultChecked className="rounded" />
                  <label htmlFor="presence-tracking" className="text-sm font-medium">
                    Enable presence tracking
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Rate Limiting</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max connections per client
                  </label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messages per minute
                  </label>
                  <input
                    type="number"
                    defaultValue="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Functions & Realtime</h1>
          <p className="text-gray-600 mt-2">
            Deploy serverless functions and manage real-time subscriptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>All systems operational</span>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Runtime Settings
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "functions" && renderFunctions()}
        {activeTab === "realtime" && renderRealtime()}
        {activeTab === "logs" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Function Logs</h3>
                <p>Real-time logs and monitoring coming soon.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
