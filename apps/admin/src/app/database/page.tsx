"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Table, 
  Play, 
  Plus, 
  Search, 
  Settings,
  Code,
  Zap,
  Globe,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState("tables");
  const [selectedTable, setSelectedTable] = useState("users");

  // Mock data
  const tables = [
    {
      name: "users",
      schema: "public",
      rowCount: 2847,
      columns: 12,
      description: "User accounts and profiles",
      lastModified: "2024-06-21T10:30:00Z",
    },
    {
      name: "organizations",
      schema: "public", 
      rowCount: 156,
      columns: 8,
      description: "Organization information",
      lastModified: "2024-06-20T15:45:00Z",
    },
    {
      name: "projects",
      schema: "public",
      rowCount: 423,
      columns: 15,
      description: "Project management data",
      lastModified: "2024-06-21T09:15:00Z",
    },
    {
      name: "content",
      schema: "public",
      rowCount: 1284,
      columns: 18,
      description: "Content management system",
      lastModified: "2024-06-21T14:20:00Z",
    },
  ];

  const sampleData = [
    { id: 1, email: "john@example.com", name: "John Doe", role: "admin", created_at: "2024-01-15" },
    { id: 2, email: "jane@example.com", name: "Jane Smith", role: "user", created_at: "2024-02-10" },
    { id: 3, email: "bob@example.com", name: "Bob Johnson", role: "moderator", created_at: "2024-03-05" },
  ];

  const tabs = [
    { id: "tables", name: "Tables", icon: Table },
    { id: "sql", name: "SQL Editor", icon: Code },
    { id: "functions", name: "Functions", icon: Zap },
    { id: "api", name: "API", icon: Globe },
  ];

  const renderTables = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Database Tables</h2>
          <p className="text-gray-600 mt-1">Browse and manage your database tables</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tables</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tables..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-l-4 transition-colors ${
                    selectedTable === table.name 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{table.name}</div>
                      <div className="text-sm text-gray-500">{table.rowCount.toLocaleString()} rows</div>
                    </div>
                    <div className="text-xs text-gray-400">{table.columns} cols</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Data */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  {selectedTable}
                </CardTitle>
                <CardDescription>
                  {tables.find(t => t.name === selectedTable)?.description}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    {Object.keys(sampleData[0] || {}).map((column) => (
                      <th key={column} className="text-left p-2 font-medium text-gray-700 bg-gray-50">
                        {column}
                      </th>
                    ))}
                    <th className="text-left p-2 font-medium text-gray-700 bg-gray-50 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="p-2 text-sm">
                          <input
                            type="text"
                            value={String(value)}
                            className="w-full border-none bg-transparent focus:bg-white focus:border focus:border-blue-500 focus:rounded px-1"
                            readOnly
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing 3 of {tables.find(t => t.name === selectedTable)?.rowCount.toLocaleString()} rows
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your database tables, run SQL queries, and generate APIs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected</span>
          </div>
          <Button variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Connection Settings
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
        {activeTab === "tables" && renderTables()}
        {activeTab !== "tables" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">{tabs.find(t => t.id === activeTab)?.name}</h3>
                <p>This section is under development.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
