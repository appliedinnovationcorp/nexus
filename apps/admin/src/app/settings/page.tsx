"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { 
  Settings, 
  Shield, 
  Mail, 
  Database, 
  Palette, 
  Globe, 
  Bell,
  Key,
  Server,
  Users,
  Save,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "general", name: "General", icon: Settings },
    { id: "security", name: "Security", icon: Shield },
    { id: "email", name: "Email", icon: Mail },
    { id: "database", name: "Database", icon: Database },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "integrations", name: "Integrations", icon: Globe },
    { id: "notifications", name: "Notifications", icon: Bell },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>
            Basic information about your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Site Name">
              <input
                type="text"
                defaultValue="Nexus Platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Site URL">
              <input
                type="url"
                defaultValue="https://nexus.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Admin Email">
              <input
                type="email"
                defaultValue="admin@nexus.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Time Zone">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </FormField>
          </div>
          <FormField label="Site Description">
            <textarea
              rows={3}
              defaultValue="A comprehensive platform for managing users, organizations, and projects."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
          <CardDescription>
            Control how new users can register
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="allow-registration" defaultChecked className="rounded" />
            <label htmlFor="allow-registration" className="text-sm font-medium">
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
              Require admin approval for new accounts
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authentication
          </CardTitle>
          <CardDescription>
            Configure authentication and security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Session Timeout (minutes)">
              <input
                type="number"
                defaultValue="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Max Login Attempts">
              <input
                type="number"
                defaultValue="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="two-factor" defaultChecked className="rounded" />
              <label htmlFor="two-factor" className="text-sm font-medium">
                Enable two-factor authentication
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="password-complexity" defaultChecked className="rounded" />
              <label htmlFor="password-complexity" className="text-sm font-medium">
                Enforce strong password requirements
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="login-notifications" className="rounded" />
              <label htmlFor="login-notifications" className="text-sm font-medium">
                Send email notifications for new logins
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Security
          </CardTitle>
          <CardDescription>
            Manage API keys and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Master API Key</h4>
              <p className="text-sm text-gray-500">Full access to all API endpoints</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Read-Only API Key</h4>
              <p className="text-sm text-gray-500">Limited to read operations only</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Configure email delivery settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="SMTP Host">
              <input
                type="text"
                defaultValue="smtp.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="SMTP Port">
              <input
                type="number"
                defaultValue="587"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Username">
              <input
                type="text"
                defaultValue="noreply@nexus.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
            <FormField label="Password">
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="smtp-ssl" defaultChecked className="rounded" />
            <label htmlFor="smtp-ssl" className="text-sm font-medium">
              Use SSL/TLS encryption
            </label>
          </div>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Test Email Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize email templates for different notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Welcome Email",
              "Password Reset",
              "Email Verification",
              "Account Activation",
              "Weekly Report",
            ].map((template) => (
              <div key={template} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="font-medium">{template}</span>
                <Button variant="outline" size="sm">
                  Edit Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "security":
        return renderSecuritySettings();
      case "email":
        return renderEmailSettings();
      default:
        return (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">{tabs.find(t => t.id === activeTab)?.name} Settings</h3>
                <p>This section is under development.</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your platform settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="flex space-x-6">
        {/* Settings Navigation */}
        <div className="w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
