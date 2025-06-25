"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FolderOpen,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { projectsApi } from "@/lib/api/projects";
import { billingApi } from "@/lib/api/billing";
import { communicationApi } from "@/lib/api/communication";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { client } = useAuth();

  const { data: projectStats } = useQuery({
    queryKey: ["project-stats"],
    queryFn: projectsApi.getProjectStats,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getProjects,
  });

  const { data: billingStats } = useQuery({
    queryKey: ["billing-stats"],
    queryFn: billingApi.getBillingStats,
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: billingApi.getInvoices,
  });

  const { data: communicationStats } = useQuery({
    queryKey: ["communication-stats"],
    queryFn: communicationApi.getCommunicationStats,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: communicationApi.getNotifications,
  });

  const activeProjects = projects?.filter(p => p.status === 'in-progress') || [];
  const recentInvoices = invoices?.slice(0, 3) || [];
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  const stats = [
    {
      title: "Active Projects",
      value: projectStats?.activeProjects || 0,
      change: "+2 this month",
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Spent",
      value: formatCurrency(projectStats?.totalSpent || 0),
      change: `${formatCurrency(projectStats?.totalBudget || 0)} budget`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Outstanding",
      value: formatCurrency(billingStats?.totalOutstanding || 0),
      change: `${billingStats?.invoiceCount.pending || 0} pending`,
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Unread Messages",
      value: communicationStats?.unreadMessages || 0,
      change: `${communicationStats?.activeConversations || 0} conversations`,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {client?.firstName}!
              </h1>
              <p className="text-blue-100 mt-1">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2 text-blue-100">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(new Date())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
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
          {/* Active Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Active Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </p>
                        <Badge
                          variant={
                            project.priority === 'high' ? 'destructive' :
                            project.priority === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {project.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1">
                        <Progress value={project.progress} className="flex-1 mr-2" />
                        <span className="text-sm text-gray-500">{project.progress}%</span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        {project.teamMembers.length} members
                        <span className="mx-2">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        Due {formatDate(project.estimatedEndDate)}
                      </div>
                    </div>
                  </div>
                ))}
                {activeProjects.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No active projects</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unreadNotifications.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'project_update' && (
                        <div className="bg-blue-100 p-1 rounded-full">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      {notification.type === 'invoice_created' && (
                        <div className="bg-green-100 p-1 rounded-full">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      {notification.type === 'message_received' && (
                        <div className="bg-purple-100 p-1 rounded-full">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {unreadNotifications.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>You're all caught up!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/billing">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.projectName || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'overdue' ? 'destructive' : 'secondary'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentInvoices.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No recent invoices</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                  <Link href="/projects">
                    <FolderOpen className="h-6 w-6 mb-2" />
                    <span className="text-sm">View Projects</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                  <Link href="/messages">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="text-sm">Messages</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                  <Link href="/billing">
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-sm">Billing</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center" asChild>
                  <Link href="/support">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="text-sm">Get Support</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
