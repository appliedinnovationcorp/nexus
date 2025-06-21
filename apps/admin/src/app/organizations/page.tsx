"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Search, Filter, Download } from "lucide-react";
import Link from "next/link";
import { organizationColumns } from "./columns";
import { getOrganizations } from "@/lib/api/organizations";

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: organizations, isLoading, error } = useQuery({
    queryKey: ["organizations", searchTerm],
    queryFn: () => getOrganizations({ search: searchTerm }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-2">
            Manage organizations and their settings
          </p>
        </div>
        <Link href="/organizations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Management</CardTitle>
          <CardDescription>
            View and manage all organizations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
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
              Error loading organizations. Please try again.
            </div>
          ) : (
            <DataTable columns={organizationColumns} data={organizations || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
