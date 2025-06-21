import { Content, CreateContentData, UpdateContentData, ContentFilters, ContentCategory } from "@/types/content";

const mockContent: Content[] = [
  {
    id: "1",
    title: "Getting Started with Nexus Platform",
    slug: "getting-started-nexus",
    type: "documentation",
    status: "published",
    content: "# Getting Started\n\nWelcome to the Nexus platform. This guide will help you get up and running quickly...",
    excerpt: "A comprehensive guide to getting started with the Nexus platform",
    featuredImage: "/images/getting-started.jpg",
    authorId: "1",
    authorName: "John Doe",
    categoryId: "1",
    categoryName: "Documentation",
    tags: ["getting-started", "tutorial", "basics"],
    seoTitle: "Getting Started with Nexus Platform - Complete Guide",
    seoDescription: "Learn how to get started with the Nexus platform in this comprehensive guide",
    publishedAt: "2024-06-15T10:00:00Z",
    viewCount: 1250,
    createdAt: "2024-06-10T08:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z",
    metadata: {
      readingTime: 8,
      wordCount: 1200,
      language: "en",
      template: "documentation",
    },
  },
  {
    id: "2",
    title: "Product Update: New Dashboard Features",
    slug: "product-update-dashboard-features",
    type: "post",
    status: "published",
    content: "We're excited to announce several new features in our dashboard...",
    excerpt: "Discover the latest dashboard features and improvements",
    featuredImage: "/images/dashboard-update.jpg",
    authorId: "2",
    authorName: "Jane Smith",
    categoryId: "2",
    categoryName: "Product Updates",
    tags: ["product-update", "dashboard", "features"],
    seoTitle: "New Dashboard Features - Product Update",
    seoDescription: "Explore the latest dashboard features and improvements in our product update",
    publishedAt: "2024-06-20T14:30:00Z",
    viewCount: 890,
    createdAt: "2024-06-18T12:00:00Z",
    updatedAt: "2024-06-20T14:30:00Z",
    metadata: {
      readingTime: 5,
      wordCount: 750,
      language: "en",
      template: "blog-post",
    },
  },
  {
    id: "3",
    title: "API Documentation v2.0",
    slug: "api-documentation-v2",
    type: "documentation",
    status: "draft",
    content: "# API Documentation v2.0\n\n## Authentication\n\nAll API requests require authentication...",
    excerpt: "Complete API documentation for version 2.0",
    authorId: "3",
    authorName: "Bob Johnson",
    categoryId: "1",
    categoryName: "Documentation",
    tags: ["api", "documentation", "v2"],
    seoTitle: "API Documentation v2.0 - Developer Guide",
    seoDescription: "Complete API documentation for developers using Nexus platform v2.0",
    viewCount: 0,
    createdAt: "2024-06-21T09:00:00Z",
    updatedAt: "2024-06-21T15:30:00Z",
    metadata: {
      readingTime: 15,
      wordCount: 2500,
      language: "en",
      template: "api-docs",
    },
  },
  {
    id: "4",
    title: "Frequently Asked Questions",
    slug: "faq",
    type: "faq",
    status: "published",
    content: "## General Questions\n\n### What is Nexus?\nNexus is a comprehensive platform...",
    excerpt: "Common questions and answers about the Nexus platform",
    authorId: "4",
    authorName: "Alice Brown",
    categoryId: "3",
    categoryName: "Support",
    tags: ["faq", "help", "support"],
    seoTitle: "Frequently Asked Questions - Nexus Platform",
    seoDescription: "Find answers to common questions about the Nexus platform",
    publishedAt: "2024-06-10T16:00:00Z",
    viewCount: 2100,
    createdAt: "2024-06-05T10:00:00Z",
    updatedAt: "2024-06-20T11:15:00Z",
    metadata: {
      readingTime: 10,
      wordCount: 1500,
      language: "en",
      template: "faq",
    },
  },
  {
    id: "5",
    title: "Privacy Policy Update",
    slug: "privacy-policy-update",
    type: "page",
    status: "scheduled",
    content: "# Privacy Policy\n\nLast updated: July 1, 2024\n\nThis Privacy Policy describes...",
    excerpt: "Updated privacy policy effective July 1, 2024",
    authorId: "1",
    authorName: "John Doe",
    categoryId: "4",
    categoryName: "Legal",
    tags: ["privacy", "policy", "legal"],
    seoTitle: "Privacy Policy - Nexus Platform",
    seoDescription: "Read our updated privacy policy to understand how we protect your data",
    scheduledAt: "2024-07-01T00:00:00Z",
    viewCount: 0,
    createdAt: "2024-06-20T14:00:00Z",
    updatedAt: "2024-06-21T10:30:00Z",
    metadata: {
      readingTime: 12,
      wordCount: 1800,
      language: "en",
      template: "legal-page",
    },
  },
];

const mockCategories: ContentCategory[] = [
  { id: "1", name: "Documentation", slug: "documentation", description: "Technical documentation and guides", contentCount: 2, createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", name: "Product Updates", slug: "product-updates", description: "Latest product news and updates", contentCount: 1, createdAt: "2024-01-01T00:00:00Z" },
  { id: "3", name: "Support", slug: "support", description: "Help and support content", contentCount: 1, createdAt: "2024-01-01T00:00:00Z" },
  { id: "4", name: "Legal", slug: "legal", description: "Legal documents and policies", contentCount: 1, createdAt: "2024-01-01T00:00:00Z" },
];

export async function getContent(filters: ContentFilters = {}): Promise<Content[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredContent = [...mockContent];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredContent = filteredContent.filter(content => 
      content.title.toLowerCase().includes(searchLower) ||
      content.content.toLowerCase().includes(searchLower) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  if (filters.type) {
    filteredContent = filteredContent.filter(content => content.type === filters.type);
  }
  
  if (filters.status) {
    filteredContent = filteredContent.filter(content => content.status === filters.status);
  }
  
  if (filters.categoryId) {
    filteredContent = filteredContent.filter(content => content.categoryId === filters.categoryId);
  }
  
  return filteredContent;
}

export async function getContentById(id: string): Promise<Content | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockContent.find(content => content.id === id) || null;
}

export async function createContent(data: CreateContentData): Promise<Content> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const wordCount = data.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  
  const newContent: Content = {
    id: (mockContent.length + 1).toString(),
    ...data,
    status: "draft",
    authorId: "1", // Would be current user
    authorName: "Current User",
    categoryName: data.categoryId ? mockCategories.find(c => c.id === data.categoryId)?.name || "" : "",
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      ...data.metadata,
      wordCount,
      readingTime,
    },
  };
  
  mockContent.push(newContent);
  return newContent;
}

export async function updateContent(id: string, data: UpdateContentData): Promise<Content> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const contentIndex = mockContent.findIndex(content => content.id === id);
  if (contentIndex === -1) {
    throw new Error("Content not found");
  }
  
  const currentContent = mockContent[contentIndex]!;
  const updatedContent: Content = {
    ...currentContent,
    title: data.title ?? currentContent.title,
    slug: data.slug ?? currentContent.slug,
    type: data.type ?? currentContent.type,
    status: data.status ?? currentContent.status,
    content: data.content ?? currentContent.content,
    excerpt: data.excerpt ?? currentContent.excerpt,
    featuredImage: data.featuredImage ?? currentContent.featuredImage,
    categoryId: data.categoryId ?? currentContent.categoryId,
    categoryName: data.categoryId ? mockCategories.find(c => c.id === data.categoryId)?.name || currentContent.categoryName : currentContent.categoryName,
    tags: data.tags ?? currentContent.tags,
    seoTitle: data.seoTitle ?? currentContent.seoTitle,
    seoDescription: data.seoDescription ?? currentContent.seoDescription,
    scheduledAt: data.scheduledAt ?? currentContent.scheduledAt,
    updatedAt: new Date().toISOString(),
    metadata: data.metadata ? { ...currentContent.metadata, ...data.metadata } : currentContent.metadata,
  };
  
  // Update word count and reading time if content changed
  if (data.content) {
    const wordCount = data.content.split(/\s+/).length;
    updatedContent.metadata.wordCount = wordCount;
    updatedContent.metadata.readingTime = Math.ceil(wordCount / 200);
  }
  
  mockContent[contentIndex] = updatedContent;
  return updatedContent;
}

export async function deleteContent(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const contentIndex = mockContent.findIndex(content => content.id === id);
  if (contentIndex === -1) {
    throw new Error("Content not found");
  }
  
  mockContent.splice(contentIndex, 1);
}

export async function getContentCategories(): Promise<ContentCategory[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...mockCategories];
}
