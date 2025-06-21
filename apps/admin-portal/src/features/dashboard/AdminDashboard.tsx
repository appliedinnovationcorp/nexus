// Admin Dashboard - Comprehensive System Overview

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, Building2, FolderOpen, CreditCard, AlertTriangle, 
  TrendingUp, Activity, DollarSign, Clock, CheckCircle,
  XCircle, AlertCircle, Zap, Globe, Database, Server
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { adminService } from '@/services/admin-service';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalOrganizations: number;
    totalProjects: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    systemHealth: number;
    apiRequestsToday: number;
  };
  userGrowth: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
    churnedUsers: number;
  }>;
  revenueGrowth: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
  }>;
  subscriptionDistribution: Array<{
    tier: string;
    count: number;
    revenue: number;
  }>;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    apiLatency: number;
    errorRate: number;
    uptime: number;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    userCount: number;
    projectCount: number;
    revenue: number;
    subscriptionTier: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: Date;
  }>;
}

export function AdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard', selectedTimeRange],
    queryFn: () => adminService.getDashboardMetrics(selectedTimeRange),
    refetchInterval: refreshInterval,
    staleTime: 10000, // 10 seconds
  });

  // Auto-refresh toggle
  const toggleAutoRefresh = () => {
    setRefreshInterval(refreshInterval === 0 ? 30000 : 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard metrics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and key metrics</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            variant={refreshInterval > 0 ? "default" : "outline"}
            onClick={toggleAutoRefresh}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={() => refetch()}>
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics?.alerts.filter(alert => !alert.resolved && alert.type === 'error').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {metrics.alerts.filter(alert => !alert.resolved && alert.type === 'error').length} critical alerts require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={formatNumber(metrics?.overview.totalUsers || 0)}
          subtitle={`${formatNumber(metrics?.overview.activeUsers || 0)} active`}
          icon={<Users className="h-6 w-6" />}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="Organizations"
          value={formatNumber(metrics?.overview.totalOrganizations || 0)}
          subtitle="Active accounts"
          icon={<Building2 className="h-6 w-6" />}
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics?.overview.monthlyRecurringRevenue || 0)}
          subtitle="MRR"
          icon={<DollarSign className="h-6 w-6" />}
          trend="+15%"
          trendUp={true}
        />
        <MetricCard
          title="System Health"
          value={`${metrics?.overview.systemHealth || 0}%`}
          subtitle="Overall uptime"
          icon={<Activity className="h-6 w-6" />}
          trend="99.9%"
          trendUp={true}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics?.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.revenueGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics?.subscriptionDistribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ tier, count }) => `${tier}: ${count}`}
                    >
                      {metrics?.subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getSubscriptionColor(entry.tier)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {metrics?.subscriptionDistribution.map((tier) => (
                    <div key={tier.tier} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getSubscriptionColor(tier.tier) }}
                        />
                        <span className="font-medium capitalize">{tier.tier}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{tier.count} accounts</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(tier.revenue)}/mo
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Organizations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topOrganizations.map((org) => (
                  <div key={org.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{org.name}</h4>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>{org.userCount} users</span>
                        <span>{org.projectCount} projects</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getSubscriptionBadgeVariant(org.subscriptionTier)}>
                        {org.subscriptionTier}
                      </Badge>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(org.revenue)}/mo
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SystemMetricCard
              title="CPU Usage"
              value={metrics?.systemMetrics.cpuUsage || 0}
              unit="%"
              icon={<Server className="h-6 w-6" />}
              threshold={80}
            />
            <SystemMetricCard
              title="Memory Usage"
              value={metrics?.systemMetrics.memoryUsage || 0}
              unit="%"
              icon={<Database className="h-6 w-6" />}
              threshold={85}
            />
            <SystemMetricCard
              title="Disk Usage"
              value={metrics?.systemMetrics.diskUsage || 0}
              unit="%"
              icon={<Database className="h-6 w-6" />}
              threshold={90}
            />
            <SystemMetricCard
              title="API Latency"
              value={metrics?.systemMetrics.apiLatency || 0}
              unit="ms"
              icon={<Zap className="h-6 w-6" />}
              threshold={500}
            />
            <SystemMetricCard
              title="Error Rate"
              value={metrics?.systemMetrics.errorRate || 0}
              unit="%"
              icon={<XCircle className="h-6 w-6" />}
              threshold={1}
            />
            <SystemMetricCard
              title="Uptime"
              value={metrics?.systemMetrics.uptime || 0}
              unit="%"
              icon={<CheckCircle className="h-6 w-6" />}
              threshold={99}
              inverse={true}
            />
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {metrics?.alerts.map((alert) => (
              <Alert 
                key={alert.id} 
                variant={alert.type === 'error' ? 'destructive' : 'default'}
              >
                {getAlertIcon(alert.type)}
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="font-semibold">{alert.title}</h4>
                    <AlertDescription>{alert.description}</AlertDescription>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(alert.timestamp)}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button size="sm" variant="outline">
                      Resolve
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div>
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-gray-600">
                        by {activity.user} • {formatDate(activity.timestamp)}
                      </div>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendUp 
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className="text-blue-600">{icon}</div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <TrendingUp 
              className={`h-4 w-4 mr-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`} 
            />
            <span className={`text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SystemMetricCard({ 
  title, 
  value, 
  unit, 
  icon, 
  threshold, 
  inverse = false 
}: {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  threshold: number;
  inverse?: boolean;
}) {
  const isHealthy = inverse ? value >= threshold : value <= threshold;
  const percentage = unit === '%' ? value : (value / threshold) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">
              {value.toFixed(1)}{unit}
            </p>
          </div>
          <div className={isHealthy ? 'text-green-600' : 'text-red-600'}>
            {icon}
          </div>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}
        />
        <p className="text-xs text-gray-500 mt-2">
          Threshold: {threshold}{unit}
        </p>
      </CardContent>
    </Card>
  );
}

// Helper Functions
function getSubscriptionColor(tier: string): string {
  const colors = {
    free: '#6B7280',
    basic: '#3B82F6',
    professional: '#10B981',
    enterprise: '#F59E0B'
  };
  return colors[tier as keyof typeof colors] || colors.free;
}

function getSubscriptionBadgeVariant(tier: string) {
  const variants = {
    free: 'secondary',
    basic: 'default',
    professional: 'default',
    enterprise: 'default'
  };
  return variants[tier as keyof typeof variants] || 'secondary';
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}
