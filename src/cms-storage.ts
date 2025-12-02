export interface TextContent {
  id: string;
  key: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  featuredImage?: string;
}

export interface PageConfig {
  id: string;
  pageKey: string;
  title: string;
  description?: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CMSStorage {
  // Text Content
  saveTextContent(content: Omit<TextContent, "id" | "createdAt" | "updatedAt">): Promise<TextContent>;
  getTextContent(id: string): Promise<TextContent | null>;
  getTextContentByKey(key: string): Promise<TextContent | null>;
  listTextContent(): Promise<TextContent[]>;
  updateTextContent(id: string, content: Partial<Omit<TextContent, "id" | "createdAt">>): Promise<TextContent | null>;
  deleteTextContent(id: string): Promise<boolean>;

  // Blog Posts
  saveBlogPost(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): Promise<BlogPost>;
  getBlogPost(id: string): Promise<BlogPost | null>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
  listBlogPosts(published?: boolean): Promise<BlogPost[]>;
  updateBlogPost(id: string, post: Partial<Omit<BlogPost, "id" | "createdAt">>): Promise<BlogPost | null>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Page Config
  savePageConfig(config: Omit<PageConfig, "id" | "createdAt" | "updatedAt">): Promise<PageConfig>;
  getPageConfig(id: string): Promise<PageConfig | null>;
  getPageConfigByKey(pageKey: string): Promise<PageConfig | null>;
  listPageConfigs(): Promise<PageConfig[]>;
  updatePageConfig(id: string, config: Partial<Omit<PageConfig, "id" | "createdAt">>): Promise<PageConfig | null>;
  deletePageConfig(id: string): Promise<boolean>;
}

export class InMemoryCMSStorage implements CMSStorage {
  private textContent: Map<string, TextContent> = new Map();
  private blogPosts: Map<string, BlogPost> = new Map();
  private pageConfigs: Map<string, PageConfig> = new Map();

  // Text Content Methods
  async saveTextContent(content: Omit<TextContent, "id" | "createdAt" | "updatedAt">): Promise<TextContent> {
    const now = new Date().toISOString();
    const id = `text-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const textContent: TextContent = {
      ...content,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.textContent.set(id, textContent);
    return textContent;
  }

  async getTextContent(id: string): Promise<TextContent | null> {
    return this.textContent.get(id) || null;
  }

  async getTextContentByKey(key: string): Promise<TextContent | null> {
    for (const content of this.textContent.values()) {
      if (content.key === key) {
        return content;
      }
    }
    return null;
  }

  async listTextContent(): Promise<TextContent[]> {
    return Array.from(this.textContent.values());
  }

  async updateTextContent(id: string, updates: Partial<Omit<TextContent, "id" | "createdAt">>): Promise<TextContent | null> {
    const existing = this.textContent.get(id);
    if (!existing) return null;

    const updated: TextContent = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.textContent.set(id, updated);
    return updated;
  }

  async deleteTextContent(id: string): Promise<boolean> {
    return this.textContent.delete(id);
  }

  // Blog Post Methods
  async saveBlogPost(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): Promise<BlogPost> {
    const now = new Date().toISOString();
    const id = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const blogPost: BlogPost = {
      ...post,
      id,
      createdAt: now,
      updatedAt: now,
      publishedAt: post.published && !post.publishedAt ? now : post.publishedAt,
    };
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }

  async getBlogPost(id: string): Promise<BlogPost | null> {
    return this.blogPosts.get(id) || null;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    for (const post of this.blogPosts.values()) {
      if (post.slug === slug) {
        return post;
      }
    }
    return null;
  }

  async listBlogPosts(published?: boolean): Promise<BlogPost[]> {
    const posts = Array.from(this.blogPosts.values());
    if (published !== undefined) {
      return posts.filter((post) => post.published === published);
    }
    return posts;
  }

  async updateBlogPost(id: string, updates: Partial<Omit<BlogPost, "id" | "createdAt">>): Promise<BlogPost | null> {
    const existing = this.blogPosts.get(id);
    if (!existing) return null;

    const updated: BlogPost = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      publishedAt:
        updates.published && !existing.publishedAt
          ? new Date().toISOString()
          : existing.publishedAt,
    };
    this.blogPosts.set(id, updated);
    return updated;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  // Page Config Methods
  async savePageConfig(config: Omit<PageConfig, "id" | "createdAt" | "updatedAt">): Promise<PageConfig> {
    const now = new Date().toISOString();
    const id = `config-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const pageConfig: PageConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.pageConfigs.set(id, pageConfig);
    return pageConfig;
  }

  async getPageConfig(id: string): Promise<PageConfig | null> {
    return this.pageConfigs.get(id) || null;
  }

  async getPageConfigByKey(pageKey: string): Promise<PageConfig | null> {
    for (const config of this.pageConfigs.values()) {
      if (config.pageKey === pageKey) {
        return config;
      }
    }
    return null;
  }

  async listPageConfigs(): Promise<PageConfig[]> {
    return Array.from(this.pageConfigs.values());
  }

  async updatePageConfig(id: string, updates: Partial<Omit<PageConfig, "id" | "createdAt">>): Promise<PageConfig | null> {
    const existing = this.pageConfigs.get(id);
    if (!existing) return null;

    const updated: PageConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.pageConfigs.set(id, updated);
    return updated;
  }

  async deletePageConfig(id: string): Promise<boolean> {
    return this.pageConfigs.delete(id);
  }
}

