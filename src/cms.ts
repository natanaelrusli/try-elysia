import { Elysia, t } from "elysia";
import {
  InMemoryCMSStorage,
  type TextContent,
  type BlogPost,
  type PageConfig,
} from "./cms-storage";
import { SupabaseCMSStorage } from "./cms-storage-supabase";
import { supabase } from "./supabase";
import { requireAuth } from "./auth";

// Helper to get CMS storage instance (uses authenticated client if available)
function getCMSStorage(supabaseClient?: any) {
  if (supabase && supabaseClient) {
    return new SupabaseCMSStorage(supabaseClient);
  }
  if (supabase) {
    return new SupabaseCMSStorage();
  }
  return new InMemoryCMSStorage();
}

export const cmsPlugin = new Elysia({ name: "cms" })
  .derive((context: any) => {
    // Access derived context from parent app
    // The parent app's derive adds user and supabaseClient
    return {
      user: context.user || null,
      supabaseClient: context.supabaseClient || null,
    };
  })
  // Text Content Routes
  .post(
    "/cms/text",
    async ({ body, user, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const textContent = await storage.saveTextContent({
        key: body.key,
        content: body.content,
      });
      return textContent;
    },
    {
      body: t.Object({
        key: t.String(),
        content: t.String(),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Create text content",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/text",
    async ({ supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const contents = await storage.listTextContent();
      return { contents };
    },
    {
      detail: {
        summary: "List all text content",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/text/key/:key",
    async ({ params: { key }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const content = await storage.getTextContentByKey(key);
      if (!content) {
        return new Response("Text content not found", { status: 404 });
      }
      return content;
    },
    {
      params: t.Object({
        key: t.String(),
      }),
      detail: {
        summary: "Get text content by key",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/text/:id",
    async ({ params: { id }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const content = await storage.getTextContent(id);
      if (!content) {
        return new Response("Text content not found", { status: 404 });
      }
      return content;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get text content by ID",
        tags: ["CMS"],
      },
    }
  )
  .put(
    "/cms/text/:id",
    async ({ params: { id }, body, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const updated = await storage.updateTextContent(id, body);
      if (!updated) {
        return new Response("Text content not found", { status: 404 });
      }
      return updated;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        key: t.Optional(t.String()),
        content: t.Optional(t.String()),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Update text content",
        tags: ["CMS"],
      },
    }
  )
  .delete(
    "/cms/text/:id",
    async ({ params: { id }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const deleted = await storage.deleteTextContent(id);
      if (!deleted) {
        return new Response("Text content not found", { status: 404 });
      }
      return { message: "Text content deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Delete text content",
        tags: ["CMS"],
      },
    }
  )
  // Blog Post Routes
  .post(
    "/cms/blog",
    async ({ body, user, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const post = await storage.saveBlogPost({
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt,
        authorId: user?.id || "unknown",
        published: body.published || false,
        tags: body.tags,
        featuredImage: body.featuredImage,
      });
      return post;
    },
    {
      body: t.Object({
        title: t.String(),
        slug: t.String(),
        content: t.String(),
        excerpt: t.Optional(t.String()),
        published: t.Optional(t.Boolean()),
        tags: t.Optional(t.Array(t.String())),
        featuredImage: t.Optional(t.String()),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Create blog post",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/blog",
    async ({ query, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const published =
        query.published !== undefined ? query.published === "true" : undefined;
      const posts = await storage.listBlogPosts(published);
      return { posts };
    },
    {
      query: t.Object({
        published: t.Optional(t.String()),
      }),
      detail: {
        summary: "List blog posts",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/blog/slug/:slug",
    async ({ params: { slug }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return new Response("Blog post not found", { status: 404 });
      }
      return post;
    },
    {
      params: t.Object({
        slug: t.String(),
      }),
      detail: {
        summary: "Get blog post by slug",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/blog/:id",
    async ({ params: { id }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const post = await storage.getBlogPost(id);
      if (!post) {
        return new Response("Blog post not found", { status: 404 });
      }
      return post;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get blog post by ID",
        tags: ["CMS"],
      },
    }
  )
  .put(
    "/cms/blog/:id",
    async ({ params: { id }, body, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const updated = await storage.updateBlogPost(id, body);
      if (!updated) {
        return new Response("Blog post not found", { status: 404 });
      }
      return updated;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        content: t.Optional(t.String()),
        excerpt: t.Optional(t.String()),
        published: t.Optional(t.Boolean()),
        tags: t.Optional(t.Array(t.String())),
        featuredImage: t.Optional(t.String()),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Update blog post",
        tags: ["CMS"],
      },
    }
  )
  .delete(
    "/cms/blog/:id",
    async ({ params: { id }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const deleted = await storage.deleteBlogPost(id);
      if (!deleted) {
        return new Response("Blog post not found", { status: 404 });
      }
      return { message: "Blog post deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Delete blog post",
        tags: ["CMS"],
      },
    }
  )
  // Page Config Routes
  .post(
    "/cms/page-config",
    async ({ body, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const config = await storage.savePageConfig({
        pageKey: body.pageKey,
        title: body.title,
        description: body.description,
        config: body.config,
      });
      return config;
    },
    {
      body: t.Object({
        pageKey: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        config: t.Record(t.String(), t.Any()),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Create page config",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/page-config",
    async ({ supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const configs = await storage.listPageConfigs();
      return { configs };
    },
    {
      detail: {
        summary: "List all page configs",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/page-config/key/:pageKey",
    async ({ params: { pageKey }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const config = await storage.getPageConfigByKey(pageKey);
      if (!config) {
        return new Response("Page config not found", { status: 404 });
      }
      return config;
    },
    {
      params: t.Object({
        pageKey: t.String(),
      }),
      detail: {
        summary: "Get page config by key",
        tags: ["CMS"],
      },
    }
  )
  .get(
    "/cms/page-config/:id",
    async ({ params: { id }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const config = await storage.getPageConfig(id);
      if (!config) {
        return new Response("Page config not found", { status: 404 });
      }
      return config;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get page config by ID",
        tags: ["CMS"],
      },
    }
  )
  .put(
    "/cms/page-config/:id",
    async ({ params: { id }, body, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const updated = await storage.updatePageConfig(id, body);
      if (!updated) {
        return new Response("Page config not found", { status: 404 });
      }
      return updated;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        pageKey: t.Optional(t.String()),
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        config: t.Optional(t.Record(t.String(), t.Any())),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Update page config",
        tags: ["CMS"],
      },
    }
  )
  .delete(
    "/cms/page-config/:id",
    async ({ params: { id }, supabaseClient }) => {
      const storage = getCMSStorage(supabaseClient);
      const deleted = await storage.deletePageConfig(id);
      if (!deleted) {
        return new Response("Page config not found", { status: 404 });
      }
      return { message: "Page config deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      beforeHandle: requireAuth,
      detail: {
        summary: "Delete page config",
        tags: ["CMS"],
      },
    }
  );
