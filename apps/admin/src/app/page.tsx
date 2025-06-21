import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FolderOpen, BarChart3, Activity, TrendingUp, FileText, Shield, Settings } from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "2,847",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Organizations",
    value: "156",
    change: "+8%",
    icon: Building2,
    color: "text-green-600",
  },
  {
    title: "Active Projects",
    value: "423",
    change: "+23%",
    icon: FolderOpen,
    color: "text-purple-600",
  },
  {
    title: "Content Items",
    value: "1,284",
    change: "+15%",
    icon: FileText,
    color: "text-orange-600",
  },
];

const quickActions = [
  { label: "Add User", href: "/users/new", color: "bg-blue-500", icon: Users },
  { label: "Create Organization", href: "/organizations/new", color: "bg-green-500", icon: Building2 },
  { label: "New Project", href: "/projects/new", color: "bg-purple-500", icon: FolderOpen },
  { label: "Create Content", href: "/content/new", color: "bg-orange-500", icon: FileText },
  { label: "View Reports", href: "/reports", color: "bg-indigo-500", icon: BarChart3 },
  { label: "Manage Permissions", href: "/permissions", color: "bg-red-500", icon: Shield },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your comprehensive admin dashboard. Manage all your entities from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions performed across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New user registered", detail: "john.doe@example.com", time: "2 minutes ago", type: "user", icon: Users },
                { action: "Project updated", detail: "Website Redesign - 65% complete", time: "5 minutes ago", type: "project", icon: FolderOpen },
                { action: "Content published", detail: "Getting Started Guide", time: "15 minutes ago", type: "content", icon: FileText },
                { action: "Organization created", detail: "TechCorp Inc.", time: "1 hour ago", type: "org", icon: Building2 },
                { action: "User role updated", detail: "Jane Smith promoted to Admin", time: "2 hours ago", type: "permission", icon: Shield },
                { action: "Report generated", detail: "Monthly Analytics Report", time: "3 hours ago", type: "report", icon: BarChart3 },
              ].map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.detail}</p>
                    </div>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    className={`${action.color} text-white p-3 rounded-lg text-center text-sm font-medium hover:opacity-90 transition-opacity flex flex-col items-center space-y-1`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{action.label}</span>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current system performance and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: "API Response Time", value: "145ms", status: "good", color: "text-green-600" },
                { metric: "Database Performance", value: "98.5%", status: "excellent", color: "text-green-600" },
                { metric: "Server Uptime", value: "99.9%", status: "excellent", color: "text-green-600" },
                { metric: "Active Sessions", value: "1,247", status: "normal", color: "text-blue-600" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.metric}</span>
                  <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>
              Key metrics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: "Total Storage Used", value: "2.4 TB", limit: "5 TB", percentage: 48 },
                { metric: "API Calls (Today)", value: "45,231", limit: "100,000", percentage: 45 },
                { metric: "Active Integrations", value: "12", limit: "25", percentage: 48 },
                { metric: "Scheduled Reports", value: "8", limit: "20", percentage: 40 },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.metric}</span>
                    <span className="text-sm font-medium">{item.value} / {item.limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
