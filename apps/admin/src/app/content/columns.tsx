"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, FileText, Calendar, User, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Content } from "@/types/content";

export const contentColumns: ColumnDef<Content>[] = [
  {
    accessorKey: "title",
    header: "Content",
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-sm text-gray-500 truncate">
            {row.original.excerpt || "No excerpt"}
          </div>
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
        page: "bg-blue-100 text-blue-800",
        post: "bg-green-100 text-green-800",
        article: "bg-purple-100 text-purple-800",
        documentation: "bg-orange-100 text-orange-800",
        faq: "bg-gray-100 text-gray-800",
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type as keyof typeof typeColors]}`}>
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        published: "bg-green-100 text-green-800",
        scheduled: "bg-blue-100 text-blue-800",
        archived: "bg-red-100 text-red-800",
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "authorName",
    header: "Author",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <User className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm">{row.getValue("authorName")}</span>
      </div>
    ),
  },
  {
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("categoryName") as string;
      return category ? (
        <span className="text-sm text-gray-700">{category}</span>
      ) : (
        <span className="text-sm text-gray-400">Uncategorized</span>
      );
    },
  },
  {
    accessorKey: "viewCount",
    header: "Views",
    cell: ({ row }) => (
      <div className="flex items-center space-x-1">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">
          {(row.getValue("viewCount") as number).toLocaleString()}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "publishedAt",
    header: "Published",
    cell: ({ row }) => {
      const publishedAt = row.getValue("publishedAt") as string;
      const scheduledAt = row.original.scheduledAt;
      
      if (row.original.status === "scheduled" && scheduledAt) {
        const date = new Date(scheduledAt);
        return (
          <div className="flex items-center space-x-1 text-blue-600">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {date.toLocaleDateString()}
            </span>
          </div>
        );
      }
      
      if (publishedAt) {
        const date = new Date(publishedAt);
        return (
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              {date.toLocaleDateString()}
            </span>
          </div>
        );
      }
      
      return <span className="text-gray-400 text-sm">-</span>;
    },
  },
  {
    accessorKey: "metadata",
    header: "Reading Time",
    cell: ({ row }) => {
      const readingTime = row.original.metadata.readingTime;
      return readingTime ? (
        <span className="text-sm text-gray-600">{readingTime} min</span>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const content = row.original;
      
      return (
        <div className="flex items-center space-x-2">
          <Link href={`/content/${content.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/content/${content.id}/edit`}>
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
