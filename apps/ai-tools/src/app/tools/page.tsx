"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Image,
  Code,
  BarChart3,
  MessageSquare,
  Mic,
  Languages,
  FileSearch,
  Search,
  Filter,
  Star,
  ArrowRight,
  Zap,
  Crown,
} from "lucide-react";
import { useTools } from "@/contexts/tools-context";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ToolsPage() {
  const { activeTools } = useTools();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const iconMap: Record<string, any> = {
    FileText,
    Image,
    Code,
    BarChart3,
    MessageSquare,
    Mic,
    Languages,
    FileSearch,
  };

  const categories = [
    { value: "all", label: "All Tools" },
    { value: "content", label: "Content" },
    { value: "creative", label: "Creative" },
    { value: "development", label: "Development" },
    { value: "analytics", label: "Analytics" },
    { value: "automation", label: "Automation" },
    { value: "audio", label: "Audio" },
    { value: "productivity", label: "Productivity" },
    { value: "language", label: "Language" },
  ];

  const filteredTools = activeTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesPremium = !showPremiumOnly || tool.isPremium;
    
    return matchesSearch && matchesCategory && matchesPremium;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      content: "bg-blue-100 text-blue-800",
      creative: "bg-purple-100 text-purple-800",
      development: "bg-green-100 text-green-800",
      analytics: "bg-orange-100 text-orange-800",
      automation: "bg-indigo-100 text-indigo-800",
      audio: "bg-pink-100 text-pink-800",
      productivity: "bg-teal-100 text-teal-800",
      language: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
            <p className="text-gray-600 mt-1">
              Discover and use our comprehensive suite of AI-powered tools
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Badge variant="secondary" className="text-sm">
              {filteredTools.length} tools available
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showPremiumOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Premium
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => {
            const Icon = iconMap[tool.icon] || FileText;
            
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {tool.name}
                            {tool.isPremium && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                          </CardTitle>
                          <Badge className={getCategoryColor(tool.category)}>
                            {tool.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardDescription className="text-sm mb-4">
                      {tool.description}
                    </CardDescription>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Features</p>
                        <div className="flex flex-wrap gap-1">
                          {tool.features.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {tool.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{tool.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Zap className="h-3 w-3 mr-1" />
                          v{tool.version}
                        </div>
                        <Link href={`/tools/${tool.id}`}>
                          <Button size="sm" className="group-hover:bg-blue-600 transition-colors">
                            Use Tool
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria or browse all available tools.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setShowPremiumOnly(false);
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tool Categories Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Categories</CardTitle>
            <CardDescription>
              Explore tools by category to find what you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(1).map((category) => {
                const toolCount = activeTools.filter(tool => tool.category === category.value).length;
                return (
                  <Button
                    key={category.value}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center justify-center"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    <span className="font-medium">{category.label}</span>
                    <span className="text-xs text-gray-500 mt-1">
                      {toolCount} tool{toolCount !== 1 ? 's' : ''}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
