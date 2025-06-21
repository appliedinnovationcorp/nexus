"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  Settings,
  Lock,
  Unlock,
  Crown
} from "lucide-react";

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState("roles");

  // Mock data
  const roles = [
    {
      id: "1",
      name: "Super Admin",
      description: "Full system access with all permissions",
      type: "system",
      userCount: 2,
      permissions: 45,
      color: "bg-red-100 text-red-800",
    },
    {
      id: "2",
      name: "Admin",
      description: "Administrative access to most features",
      type: "system",
      userCount: 5,
      permissions: 32,
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "3",
      name: "Project Manager",
      description: "Manage projects and team members",
      type: "custom",
      userCount: 12,
      permissions: 18,
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "4",
      name: "Content Editor",
      description: "Create and edit content",
      type: "custom",
      userCount: 8,
      permissions: 12,
      color: "bg-green-100 text-green-800",
    },
    {
      id: "5",
      name: "User",
      description: "Basic user access",
      type: "system",
      userCount: 156,
      permissions: 6,
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const permissions = [
    {
      id: "1",
      name: "user.create",
      description: "Create new users",
      resource: "User",
      action: "create",
      scope: "global",
      category: "user",
    },
    {
      id: "2",
      name: "user.read",
      description: "View user information",
      resource: "User",
      action: "read",
      scope: "global",
      category: "user",
    },
    {
      id: "3",
      name: "user.update",
      description: "Update user information",
      resource: "User",
      action: "update",
      scope: "global",
      category: "user",
    },
    {
      id: "4",
      name: "project.manage",
      description: "Full project management access",
      resource: "Project",
      action: "manage",
      scope: "organization",
      category: "project",
    },
    {
      id: "5",
      name: "content.create",
      description: "Create new content",
      resource: "Content",
      action: "create",
      scope: "organization",
      category: "content",
    },
  ];

  const userPermissions = [
    {
      id: "1",
      userName: "John Doe",
      userEmail: "john@example.com",
      roles: ["Super Admin"],
      directPermissions: 0,
      organizationName: "Acme Corporation",
      lastUpdated: "2024-06-20T14:30:00Z",
    },
    {
      id: "2",
      userName: "Jane Smith",
      userEmail: "jane@example.com",
      roles: ["Project Manager", "Content Editor"],
      directPermissions: 2,
      organizationName: "StartupXYZ",
      lastUpdated: "2024-06-19T16:45:00Z",
    },
    {
      id: "3",
      userName: "Bob Johnson",
      userEmail: "bob@example.com",
      roles: ["Admin"],
      directPermissions: 0,
      organizationName: "Acme Corporation",
      lastUpdated: "2024-06-18T10:15:00Z",
    },
  ];

  const renderRoles = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Role Management</h2>
          <p className="text-gray-600 mt-1">Create and manage user roles and their permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  {role.type === "system" ? (
                    <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                  ) : (
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  )}
                  {role.name}
                </CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                  {role.type}
                </span>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-medium">{role.userCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions:</span>
                  <span className="font-medium">{role.permissions}</span>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {role.type === "custom" && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Permission Registry</h2>
          <p className="text-gray-600 mt-1">View and manage all available permissions</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search permissions..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{permission.name}</div>
                        <div className="text-sm text-gray-500">{permission.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{permission.resource}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {permission.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {permission.scope}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {permission.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUserPermissions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Permissions</h2>
          <p className="text-gray-600 mt-1">Manage individual user permissions and role assignments</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {userPermissions.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.userName}</h3>
                    <p className="text-sm text-gray-500">{user.userEmail}</p>
                    <p className="text-sm text-gray-500">{user.organizationName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {user.roles.map((role, index) => (
                        <span key={index} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {user.directPermissions > 0 && `+${user.directPermissions} direct permissions`}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated: {new Date(user.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <UserCheck className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: "roles", name: "Roles", icon: Shield },
    { id: "permissions", name: "Permissions", icon: Lock },
    { id: "users", name: "User Permissions", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions & Access Control</h1>
          <p className="text-gray-600 mt-2">
            Manage roles, permissions, and user access across your platform
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Security Settings
        </Button>
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
        {activeTab === "roles" && renderRoles()}
        {activeTab === "permissions" && renderPermissions()}
        {activeTab === "users" && renderUserPermissions()}
      </div>
    </div>
  );
}
