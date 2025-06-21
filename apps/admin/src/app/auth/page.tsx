"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { 
  Shield, 
  Users, 
  Key, 
  Mail, 
  Phone, 
  Github, 
  Chrome,
  Smartphone,
  Lock,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("providers");
  const [showSecret, setShowSecret] = useState(false);

  // Mock data
  const authProviders = [
    {
      id: "email",
      name: "Email & Password",
      type: "email",
      enabled: true,
      icon: Mail,
      description: "Traditional email and password authentication",
      users: 1247,
    },
    {
      id: "google",
      name: "Google OAuth",
      type: "oauth",
      enabled: true,
      icon: Chrome,
      description: "Sign in with Google accounts",
      users: 892,
    },
    {
      id: "github",
      name: "GitHub OAuth",
      type: "oauth",
      enabled: true,
      icon: Github,
      description: "Sign in with GitHub accounts",
      users: 456,
    },
    {
      id: "phone",
      name: "Phone (SMS)",
      type: "phone",
      enabled: false,
      icon: Phone,
      description: "SMS-based phone authentication",
      users: 0,
    },
    {
      id: "magic-link",
      name: "Magic Link",
      type: "magic-link",
      enabled: true,
      icon: Mail,
      description: "Passwordless email authentication",
      users: 234,
    },
  ];

  const authPolicies = [
    {
      id: "1",
      name: "User Profile Access",
      table: "profiles",
      operation: "SELECT",
      policy: "auth.uid() = user_id",
      roles: ["authenticated"],
      enabled: true,
    },
    {
      id: "2",
      name: "Project Owner Access",
      table: "projects",
      operation: "UPDATE",
      policy: "auth.uid() = owner_id OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid() AND role = 'admin')",
      roles: ["authenticated"],
      enabled: true,
    },
    {
      id: "3",
      name: "Organization Admin Access",
      table: "organizations",
      operation: "DELETE",
      policy: "EXISTS (SELECT 1 FROM organization_members WHERE org_id = id AND user_id = auth.uid() AND role = 'admin')",
      roles: ["authenticated"],
      enabled: true,
    },
  ];

  const mfaStats = {
    totalUsers: 2847,
    mfaEnabled: 1423,
    totpUsers: 1156,
    smsUsers: 267,
    emailUsers: 89,
  };

  const tabs = [
    { id: "providers", name: "Auth Providers", icon: Key },
    { id: "policies", name: "Row Level Security", icon: Shield },
    { id: "mfa", name: "Multi-Factor Auth", icon: Smartphone },
    { id: "settings", name: "Auth Settings", icon: Settings },
  ];

  const renderProviders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Authentication Providers</h2>
          <p className="text-gray-600 mt-1">Configure how users can sign up and sign in</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authProviders.map((provider) => {
          const Icon = provider.icon;
          return (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.enabled 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {provider.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Users:</span>
                    <span className="font-medium">{provider.users.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={provider.enabled ? "text-red-600" : "text-green-600"}
                    >
                      {provider.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Configuration</CardTitle>
          <CardDescription>
            Configure OAuth providers with client credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Google Client ID">
              <input
                type="text"
                placeholder="your-google-client-id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Google Client Secret">
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  placeholder="your-google-client-secret"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Redirect URL
            </Button>
            <Button>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Row Level Security Policies</h2>
          <p className="text-gray-600 mt-1">Control data access at the database level</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {authPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{policy.name}</div>
                        <div className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded mt-1">
                          {policy.policy}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">{policy.table}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {policy.operation}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        policy.enabled 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {policy.enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
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

      {/* Policy Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Builder</CardTitle>
          <CardDescription>
            Create a new row-level security policy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Policy Name">
              <input
                type="text"
                placeholder="e.g., User can view own profile"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Table">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select table</option>
                <option value="profiles">profiles</option>
                <option value="projects">projects</option>
                <option value="organizations">organizations</option>
              </select>
            </FormField>
            <FormField label="Operation">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="SELECT">SELECT</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </FormField>
          </div>
          <FormField label="Policy Expression">
            <textarea
              rows={3}
              placeholder="auth.uid() = user_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </FormField>
          <div className="flex space-x-2">
            <Button variant="outline">Test Policy</Button>
            <Button>Create Policy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMFA = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Multi-Factor Authentication</h2>
          <p className="text-gray-600 mt-1">Enhance security with additional authentication factors</p>
        </div>
      </div>

      {/* MFA Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: mfaStats.totalUsers, color: "text-blue-600" },
          { label: "MFA Enabled", value: mfaStats.mfaEnabled, color: "text-green-600" },
          { label: "TOTP Users", value: mfaStats.totpUsers, color: "text-purple-600" },
          { label: "SMS Users", value: mfaStats.smsUsers, color: "text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                {stat.label === "MFA Enabled" && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((stat.value / mfaStats.totalUsers) * 100)}% adoption
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MFA Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              TOTP Configuration
            </CardTitle>
            <CardDescription>
              Time-based One-Time Password settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="enable-totp" defaultChecked className="rounded" />
              <label htmlFor="enable-totp" className="text-sm font-medium">
                Enable TOTP authentication
              </label>
            </div>
            <FormField label="Issuer Name">
              <input
                type="text"
                defaultValue="Nexus Platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Code Length">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="6">6 digits</option>
                <option value="8">8 digits</option>
              </select>
            </FormField>
            <FormField label="Time Window">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              SMS Configuration
            </CardTitle>
            <CardDescription>
              SMS-based authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="enable-sms" className="rounded" />
              <label htmlFor="enable-sms" className="text-sm font-medium">
                Enable SMS authentication
              </label>
            </div>
            <FormField label="SMS Provider">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="twilio">Twilio</option>
                <option value="aws-sns">AWS SNS</option>
                <option value="messagebird">MessageBird</option>
              </select>
            </FormField>
            <FormField label="API Key">
              <input
                type="password"
                placeholder="Enter SMS provider API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Test SMS Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* MFA Enforcement */}
      <Card>
        <CardHeader>
          <CardTitle>MFA Enforcement</CardTitle>
          <CardDescription>
            Configure when MFA is required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input type="radio" id="mfa-optional" name="mfa-enforcement" defaultChecked className="rounded" />
              <label htmlFor="mfa-optional" className="text-sm font-medium">
                Optional - Users can enable MFA voluntarily
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="radio" id="mfa-required-admin" name="mfa-enforcement" className="rounded" />
              <label htmlFor="mfa-required-admin" className="text-sm font-medium">
                Required for admin users only
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="radio" id="mfa-required-all" name="mfa-enforcement" className="rounded" />
              <label htmlFor="mfa-required-all" className="text-sm font-medium">
                Required for all users
              </label>
            </div>
          </div>
          <div className="pt-4">
            <Button>Save MFA Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Authentication Settings</h2>
        <p className="text-gray-600 mt-1">Configure global authentication behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
            <CardDescription>
              Control how new users can sign up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="enable-signup" defaultChecked className="rounded" />
                <label htmlFor="enable-signup" className="text-sm font-medium">
                  Allow new user registration
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="email-verification" defaultChecked className="rounded" />
                <label htmlFor="email-verification" className="text-sm font-medium">
                  Require email verification
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="admin-approval" className="rounded" />
                <label htmlFor="admin-approval" className="text-sm font-medium">
                  Require admin approval
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password Policy</CardTitle>
            <CardDescription>
              Set password requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Minimum Length">
              <input
                type="number"
                defaultValue="8"
                min="6"
                max="128"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="require-uppercase" defaultChecked className="rounded" />
                <label htmlFor="require-uppercase" className="text-sm font-medium">
                  Require uppercase letters
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="require-numbers" defaultChecked className="rounded" />
                <label htmlFor="require-numbers" className="text-sm font-medium">
                  Require numbers
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="require-symbols" className="rounded" />
                <label htmlFor="require-symbols" className="text-sm font-medium">
                  Require special characters
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Configure user sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Session Timeout (hours)">
              <input
                type="number"
                defaultValue="24"
                min="1"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Max Concurrent Sessions">
              <input
                type="number"
                defaultValue="5"
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="remember-me" defaultChecked className="rounded" />
              <label htmlFor="remember-me" className="text-sm font-medium">
                Allow &quot;Remember Me&quot; option
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JWT Configuration</CardTitle>
            <CardDescription>
              JSON Web Token settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="JWT Secret">
              <div className="flex space-x-2">
                <input
                  type="password"
                  defaultValue="your-jwt-secret-key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Access Token Expiry (minutes)">
                <input
                  type="number"
                  defaultValue="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
              <FormField label="Refresh Token Expiry (days)">
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Authentication settings saved!")}>
          Save All Settings
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authentication & Access Control</h1>
          <p className="text-gray-600 mt-2">
            Manage user authentication, security policies, and access controls
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {authProviders.filter(p => p.enabled).length} providers enabled
          </span>
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Security Audit
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
        {activeTab === "providers" && renderProviders()}
        {activeTab === "policies" && renderPolicies()}
        {activeTab === "mfa" && renderMFA()}
        {activeTab === "settings" && renderSettings()}
      </div>
    </div>
  );
}
