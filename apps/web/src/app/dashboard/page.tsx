"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FolderOpen,
  MessageSquare,
  Plus,
  Settings,
  Star,
  TrendingUp,
  Users,
  Zap,
  Target,
  Award,
  Activity,
  Bell,
  ArrowRight,
  Edit3,
  MapPin,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";

// Mock data - replace with actual API calls
const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    progress: 75,
    status: 'In Progress',
    dueDate: '2024-07-15',
    team: 4,
    priority: 'High',
  },
  {
    id: '2',
    name: 'Mobile App',
    progress: 30,
    status: 'Planning',
    dueDate: '2024-08-30',
    team: 3,
    priority: 'Medium',
  },
  {
    id: '3',
    name: 'API Integration',
    progress: 100,
    status: 'Completed',
    dueDate: '2024-06-20',
    team: 2,
    priority: 'Low',
  },
];

const mockActivities = [
  {
    id: '1',
    type: 'project',
    title: 'Updated Website Redesign',
    description: 'Added new wireframes and user flow diagrams',
    time: '2 hours ago',
    icon: FolderOpen,
  },
  {
    id: '2',
    type: 'team',
    title: 'New team member joined',
    description: 'Sarah Johnson joined the Mobile App project',
    time: '4 hours ago',
    icon: Users,
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Achievement unlocked!',
    description: 'Completed 10 projects milestone',
    time: '1 day ago',
    icon: Award,
  },
  {
    id: '4',
    type: 'message',
    title: 'New message from Alex',
    description: 'Review needed for the latest design mockups',
    time: '2 days ago',
    icon: MessageSquare,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-white/20 text-white text-lg">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="text-blue-100 mt-1">
                  Here's what's happening with your projects today.
                </p>
                {user?.location && (
                  <p className="text-blue-200 text-sm flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <p className="text-blue-100 text-sm">Current streak</p>
                <p className="text-2xl font-bold">{user?.stats.streakDays} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockProjects.filter(p => p.status !== 'Completed').length}
                  </p>
                  <p className="text-xs text-gray-500">2 due this week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.stats.projectsCompleted}</p>
                  <p className="text-xs text-gray-500">+2 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.stats.joinedTeams}</p>
                  <p className="text-xs text-gray-500">across projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activity Score</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.stats.activityScore}</p>
                  <p className="text-xs text-gray-500">+5 this week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {project.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(project.priority)}>
                              {project.priority}
                            </Badge>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {project.team} members
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due {project.dueDate}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={project.progress} className="w-20 h-2" />
                            <span className="text-sm text-gray-500 min-w-0">
                              {project.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile & Activity */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Profile</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings/profile">
                    <Edit3 className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user?.company}</p>
                    </div>
                  </div>

                  {user?.bio && (
                    <p className="text-sm text-gray-600">{user.bio}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-3 w-3 mr-2" />
                      {user?.email}
                    </div>
                    {user?.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {user.phone}
                      </div>
                    )}
                    {user?.website && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="h-3 w-3 mr-2" />
                        <a 
                          href={user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-500"
                        >
                          {user.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Subscription Info */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {user?.subscription.plan} Plan
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.subscription.features.length} features
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {user?.subscription.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.slice(0, 4).map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {user?.stats.achievements && user.stats.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.stats.achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {achievement.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {achievement.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {achievement.rarity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts to get things done faster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">New Project</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Invite Team</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Reports</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Settings className="h-6 w-6" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
