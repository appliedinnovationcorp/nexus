"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, FolderOpen, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types/project";

export const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <FolderOpen className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-gray-500">{row.original.organizationName}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors = {
        planning: "bg-gray-100 text-gray-800",
        active: "bg-green-100 text-green-800",
        "on-hold": "bg-yellow-100 text-yellow-800",
        completed: "bg-blue-100 text-blue-800",
        cancelled: "bg-red-100 text-red-800",
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
          {status.replace("-", " ")}
        </span>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const priorityColors = {
        low: "bg-gray-100 text-gray-800",
        medium: "bg-blue-100 text-blue-800",
        high: "bg-orange-100 text-orange-800",
        critical: "bg-red-100 text-red-800",
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority as keyof typeof priorityColors]}`}>
          {priority}
        </span>
      );
    },
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number;
      return (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium">
            {(row.getValue("ownerName") as string).charAt(0)}
          </span>
        </div>
        <span className="text-sm">{row.getValue("ownerName")}</span>
      </div>
    ),
  },
  {
    accessorKey: "teamMembers",
    header: "Team",
    cell: ({ row }) => {
      const members = row.original.teamMembers;
      return (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{members.length}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: "Due Date",
    cell: ({ row }) => {
      const endDate = row.getValue("endDate") as string;
      if (!endDate) return <span className="text-gray-400">-</span>;
      
      const date = new Date(endDate);
      const isOverdue = date < new Date() && row.original.status !== "completed";
      
      return (
        <div className={`flex items-center space-x-1 ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{date.toLocaleDateString()}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "budget",
    header: "Budget",
    cell: ({ row }) => {
      const budget = row.getValue("budget") as number;
      if (!budget) return <span className="text-gray-400">-</span>;
      
      return (
        <span className="text-sm font-medium">
          ${budget.toLocaleString()}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const project = row.original;
      
      return (
        <div className="flex items-center space-x-2">
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/projects/${project.id}/edit`}>
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
