"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Search, Filter, Download, FileText, Eye, Edit2 } from "lucide-react";
import Link from "next/link";
import { contentColumns } from "./columns";
import { getContent, getContentCategories } from "@/lib/api/content";

export default function ContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const { data: content, isLoading, error } = useQuery({
    queryKey: ["content", searchTerm, typeFilter, statusFilter],
    queryFn: () => getContent({ search: searchTerm, type: typeFilter, status: statusFilter }),
  });

  const { data: categories } = useQuery({
    queryKey: ["content-categories"],
    queryFn: getContentCategories,
  });

  const stats = [
    { label: "Total Content", value: content?.length || 0, color: "text-blue-600", icon: FileText },
    { label: "Published", value: content?.filter(c => c.status === "published").length || 0, color: "text-green-600", icon: Eye },
    { label: "Drafts", value: content?.filter(c => c.status === "draft").length || 0, color: "text-orange-600", icon: Edit2 },
    { label: "Total Views", value: content?.reduce((sum, c) => sum + c.viewCount, 0) || 0, color: "text-purple-600", icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-2">
            Create, edit, and manage all your content in one place
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/content/categories">
            <Button variant="outline">
              Manage Categories
            </Button>
          </Link>
          <Link href="/content/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.label === "Total Views" ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>
            Manage all your content including pages, posts, documentation, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="page">Page</option>
              <option value="post">Post</option>
              <option value="article">Article</option>
              <option value="documentation">Documentation</option>
              <option value="faq">FAQ</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              Error loading content. Please try again.
            </div>
          ) : (
            <DataTable columns={contentColumns} data={content || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
