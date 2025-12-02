import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  CMSStorage,
  TextContent,
  BlogPost,
  PageConfig,
} from "./cms-storage";

export class SupabaseCMSStorage implements CMSStorage {
  private client: SupabaseClient | null;

  constructor(client?: SupabaseClient | null) {
    this.client = client || supabase;
  }
  // Text Content Methods
  async saveTextContent(
    content: Omit<TextContent, "id" | "createdAt" | "updatedAt">
  ): Promise<TextContent> {
    if (!this.client) {
      throw new Error(
        "Supabase client not initialized. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("text_content")
      .insert({
        key: content.key,
        content: content.content,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save text content: ${error.message}`);
    }

    return {
      id: data.id,
      key: data.key,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getTextContent(id: string): Promise<TextContent | null> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("text_content")
      .select()
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      key: data.key,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getTextContentByKey(key: string): Promise<TextContent | null> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("text_content")
      .select()
      .eq("key", key)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      key: data.key,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async listTextContent(): Promise<TextContent[]> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("text_content")
      .select()
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list text content: ${error.message}`);
    }

    return (data || []).map((item) => ({
      id: item.id,
      key: item.key,
      content: item.content,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async updateTextContent(
    id: string,
    updates: Partial<Omit<TextContent, "id" | "createdAt">>
  ): Promise<TextContent | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.key !== undefined) updateData.key = updates.key;
    if (updates.content !== undefined) updateData.content = updates.content;

    const { data, error } = await supabase
      .from("text_content")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      key: data.key,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteTextContent(id: string): Promise<boolean> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const { error } = await supabase.from("text_content").delete().eq("id", id);

    return !error;
  }

  // Blog Post Methods
  async saveBlogPost(
    post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">
  ): Promise<BlogPost> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || null,
        author_id: post.authorId,
        published: post.published || false,
        published_at:
          post.published && !post.publishedAt ? now : post.publishedAt || null,
        created_at: now,
        updated_at: now,
        tags: post.tags || null,
        featured_image: post.featuredImage || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save blog post: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || undefined,
      authorId: data.author_id,
      published: data.published,
      publishedAt: data.published_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || undefined,
      featuredImage: data.featured_image || undefined,
    };
  }

  async getBlogPost(id: string): Promise<BlogPost | null> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("blog_posts")
      .select()
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || undefined,
      authorId: data.author_id,
      published: data.published,
      publishedAt: data.published_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || undefined,
      featuredImage: data.featured_image || undefined,
    };
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("blog_posts")
      .select()
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || undefined,
      authorId: data.author_id,
      published: data.published,
      publishedAt: data.published_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || undefined,
      featuredImage: data.featured_image || undefined,
    };
  }

  async listBlogPosts(published?: boolean): Promise<BlogPost[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    let query = this.client?.from("blog_posts").select() || null;

    if (published !== undefined) {
      query = query?.eq("published", published) ?? null;
    }

    const { data, error } = await (query?.order("created_at", {
      ascending: false,
    }) ?? { data: [], error: null });

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      content: item.content,
      excerpt: item.excerpt || undefined,
      authorId: item.author_id,
      published: item.published,
      publishedAt: item.published_at || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      tags: item.tags || undefined,
      featuredImage: item.featured_image || undefined,
    }));
  }

  async updateBlogPost(
    id: string,
    updates: Partial<Omit<BlogPost, "id" | "createdAt">>
  ): Promise<BlogPost | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
    if (updates.authorId !== undefined) updateData.author_id = updates.authorId;
    if (updates.published !== undefined) {
      updateData.published = updates.published;
      // Set published_at if publishing for the first time
      if (updates.published) {
        const existing = await this.getBlogPost(id);
        if (existing && !existing.publishedAt) {
          updateData.published_at = new Date().toISOString();
        }
      }
    }
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.featuredImage !== undefined)
      updateData.featured_image = updates.featuredImage;

    const { data, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || undefined,
      authorId: data.author_id,
      published: data.published,
      publishedAt: data.published_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || undefined,
      featuredImage: data.featured_image || undefined,
    };
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    return !error;
  }

  // Page Config Methods
  async savePageConfig(
    config: Omit<PageConfig, "id" | "createdAt" | "updatedAt">
  ): Promise<PageConfig> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("page_configs")
      .insert({
        page_key: config.pageKey,
        title: config.title,
        description: config.description || null,
        config: config.config,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save page config: ${error.message}`);
    }

    return {
      id: data.id,
      pageKey: data.page_key,
      title: data.title,
      description: data.description || undefined,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getPageConfig(id: string): Promise<PageConfig | null> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("page_configs")
      .select()
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      pageKey: data.page_key,
      title: data.title,
      description: data.description || undefined,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getPageConfigByKey(pageKey: string): Promise<PageConfig | null> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("page_configs")
      .select()
      .eq("page_key", pageKey)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      pageKey: data.page_key,
      title: data.title,
      description: data.description || undefined,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async listPageConfigs(): Promise<PageConfig[]> {
    if (!this.client) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await this.client
      .from("page_configs")
      .select()
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list page configs: ${error.message}`);
    }

    return (data || []).map((item) => ({
      id: item.id,
      pageKey: item.page_key,
      title: item.title,
      description: item.description || undefined,
      config: item.config,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async updatePageConfig(
    id: string,
    updates: Partial<Omit<PageConfig, "id" | "createdAt">>
  ): Promise<PageConfig | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.pageKey !== undefined) updateData.page_key = updates.pageKey;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.config !== undefined) updateData.config = updates.config;

    const { data, error } = await supabase
      .from("page_configs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      pageKey: data.page_key,
      title: data.title,
      description: data.description || undefined,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deletePageConfig(id: string): Promise<boolean> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const { error } = await supabase.from("page_configs").delete().eq("id", id);

    return !error;
  }
}
