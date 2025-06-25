"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HardDrive, 
  Upload, 
  Download, 
  Folder, 
  File, 
  Image, 
  Video, 
  FileText,
  Settings,
  Search,
  Grid,
  List,
  Trash2,
  Eye,
  Share,
  Copy,
  MoreHorizontal
} from "lucide-react";

export default function StoragePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBucket, setSelectedBucket] = useState("public");

  // Mock data
  const buckets = [
    {
      name: "public",
      description: "Public files accessible to all users",
      size: "2.4 GB",
      files: 1247,
      public: true,
    },
    {
      name: "private",
      description: "Private user files",
      size: "5.8 GB", 
      files: 3456,
      public: false,
    },
    {
      name: "uploads",
      description: "Temporary upload storage",
      size: "892 MB",
      files: 234,
      public: false,
    },
  ];

  const files = [
    {
      id: "1",
      name: "profile-avatar.jpg",
      type: "image",
      size: "245 KB",
      url: "/storage/public/profile-avatar.jpg",
      uploadedAt: "2024-06-21T10:30:00Z",
      uploadedBy: "john@example.com",
    },
    {
      id: "2", 
      name: "project-presentation.pdf",
      type: "document",
      size: "2.1 MB",
      url: "/storage/public/project-presentation.pdf",
      uploadedAt: "2024-06-20T15:45:00Z",
      uploadedBy: "jane@example.com",
    },
    {
      id: "3",
      name: "demo-video.mp4",
      type: "video",
      size: "15.3 MB", 
      url: "/storage/public/demo-video.mp4",
      uploadedAt: "2024-06-19T09:15:00Z",
      uploadedBy: "bob@example.com",
    },
    {
      id: "4",
      name: "data-export.csv",
      type: "document",
      size: "567 KB",
      url: "/storage/private/data-export.csv", 
      uploadedAt: "2024-06-18T14:20:00Z",
      uploadedBy: "alice@example.com",
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return Image;
      case "video": return Video;
      case "document": return FileText;
      default: return File;
    }
  };

  const renderFileGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {files.map((file) => {
        const Icon = getFileIcon(file.type);
        return (
          <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">{file.size}</div>
                </div>
                <div className="flex justify-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderFileList = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{file.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{file.uploadedBy}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Management</h1>
          <p className="text-gray-600 mt-2">
            Upload, manage, and organize your files and media assets
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Storage Settings
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buckets.map((bucket) => (
          <Card 
            key={bucket.name} 
            className={`cursor-pointer transition-all ${
              selectedBucket === bucket.name ? "ring-2 ring-blue-500" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedBucket(bucket.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{bucket.name}</CardTitle>
                    <CardDescription>{bucket.description}</CardDescription>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bucket.public 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {bucket.public ? "Public" : "Private"}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{bucket.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Files:</span>
                <span className="font-medium">{bucket.files.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* File Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                {selectedBucket} bucket
              </CardTitle>
              <CardDescription>
                {buckets.find(b => b.name === selectedBucket)?.description}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex border border-gray-300 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? renderFileGrid() : renderFileList()}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Drop files to upload</p>
              <p className="text-gray-500">or click to browse from your computer</p>
              <div className="flex justify-center space-x-4 text-sm text-gray-400 mt-4">
                <span>Max file size: 100MB</span>
                <span>•</span>
                <span>Supported: Images, Videos, Documents</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Transformations */}
      <Card>
        <CardHeader>
          <CardTitle>Image Transformations</CardTitle>
          <CardDescription>
            Configure automatic image processing and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Resize Presets</h4>
              <div className="space-y-2">
                {[
                  { name: "Thumbnail", size: "150x150" },
                  { name: "Small", size: "300x300" },
                  { name: "Medium", size: "600x600" },
                  { name: "Large", size: "1200x1200" },
                ].map((preset) => (
                  <div key={preset.name} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-sm text-gray-500">{preset.size}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Optimization Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="auto-webp" defaultChecked className="rounded" />
                  <label htmlFor="auto-webp" className="text-sm font-medium">
                    Auto-convert to WebP
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="progressive" defaultChecked className="rounded" />
                  <label htmlFor="progressive" className="text-sm font-medium">
                    Progressive JPEG
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="strip-metadata" className="rounded" />
                  <label htmlFor="strip-metadata" className="text-sm font-medium">
                    Strip metadata
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
