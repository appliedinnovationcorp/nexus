export interface Content {
  id: string;
  title: string;
  slug: string;
  type: "page" | "post" | "article" | "documentation" | "faq";
  status: "draft" | "published" | "archived" | "scheduled";
  content: string;
  excerpt?: string;
  featuredImage?: string;
  authorId: string;
  authorName: string;
  categoryId?: string;
  categoryName?: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  scheduledAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  metadata: {
    readingTime?: number;
    wordCount?: number;
    language?: string;
    template?: string;
  };
}

export interface CreateContentData {
  title: string;
  slug: string;
  type: "page" | "post" | "article" | "documentation" | "faq";
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  metadata?: {
    language?: string;
    template?: string;
  };
}

export interface UpdateContentData {
  title?: string;
  slug?: string;
  type?: "page" | "post" | "article" | "documentation" | "faq";
  status?: "draft" | "published" | "archived" | "scheduled";
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  metadata?: {
    language?: string;
    template?: string;
  };
}

export interface ContentFilters {
  search?: string;
  type?: string;
  status?: string;
  categoryId?: string;
  authorId?: string;
  page?: number;
  limit?: number;
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  contentCount: number;
  createdAt: string;
}
