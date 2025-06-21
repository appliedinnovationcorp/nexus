"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Building2 } from "lucide-react";
import Link from "next/link";
import { Organization } from "@/types/organization";

export const organizationColumns: ColumnDef<Organization>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Organization",
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-gray-500">{row.original.domain}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const typeColors = {
        enterprise: "bg-purple-100 text-purple-800",
        business: "bg-blue-100 text-blue-800",
        nonprofit: "bg-green-100 text-green-800",
        startup: "bg-orange-100 text-orange-800",
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}`}>
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: "memberCount",
    header: "Members",
    cell: ({ row }) => (
      <div className="text-sm font-medium">{row.getValue("memberCount")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isActive = status === "active";
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div className="text-sm">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const org = row.original;
      
      return (
        <div className="flex items-center space-x-2">
          <Link href={`/organizations/${org.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/organizations/${org.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
