import { Elysia, t } from "elysia";
import { InMemoryCMSStorage } from "./cms-storage";
import { SupabaseCMSStorage } from "./cms-storage-supabase";
import { supabase } from "./supabase";
import { requireAuth } from "./auth";
import {
  validateAndSanitizeContent,
  validateStringLength,
  sanitizePlainText,
  KEY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  EXCERPT_MAX_LENGTH,
  SLUG_MAX_LENGTH,
} from "./sanitize";

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
    async ({ body, user, supabaseClient, set }) => {
      // Validate key
      const keyValidation = validateStringLength(
        body.key,
        KEY_MAX_LENGTH,
        "Key"
      );
      if (!keyValidation.isValid) {
        set.status = 400;
        return { error: keyValidation.error };
      }

      // Validate and sanitize content
      const contentValidation = validateAndSanitizeContent(body.content);
      if (!contentValidation.isValid) {
        set.status = 400;
        return { error: contentValidation.error };
      }

      const storage = getCMSStorage(supabaseClient);
      const textContent = await storage.saveTextContent({
        key: sanitizePlainText(body.key),
        content: contentValidation.sanitized,
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
    async ({ params: { id }, body, supabaseClient, set }) => {
      const updateData: any = {};

      // Validate and sanitize key if provided
      if (body.key !== undefined) {
        const keyValidation = validateStringLength(
          body.key,
          KEY_MAX_LENGTH,
          "Key"
        );
        if (!keyValidation.isValid) {
          set.status = 400;
          return { error: keyValidation.error };
        }
        updateData.key = sanitizePlainText(body.key);
      }

      // Validate and sanitize content if provided
      if (body.content !== undefined) {
        const contentValidation = validateAndSanitizeContent(body.content);
        if (!contentValidation.isValid) {
          set.status = 400;
          return { error: contentValidation.error };
        }
        updateData.content = contentValidation.sanitized;
      }

      const storage = getCMSStorage(supabaseClient);
      const updated = await storage.updateTextContent(id, updateData);
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
    async ({ body, user, supabaseClient, set }) => {
      // Validate title
      const titleValidation = validateStringLength(
        body.title,
        TITLE_MAX_LENGTH,
        "Title"
      );
      if (!titleValidation.isValid) {
        set.status = 400;
        return { error: titleValidation.error };
      }

      // Validate slug
      const slugValidation = validateStringLength(
        body.slug,
        SLUG_MAX_LENGTH,
        "Slug"
      );
      if (!slugValidation.isValid) {
        set.status = 400;
        return { error: slugValidation.error };
      }

      // Validate and sanitize content
      const contentValidation = validateAndSanitizeContent(body.content);
      if (!contentValidation.isValid) {
        set.status = 400;
        return { error: contentValidation.error };
      }

      // Validate and sanitize excerpt if provided
      let sanitizedExcerpt: string | undefined;
      if (body.excerpt !== undefined) {
        const excerptValidation = validateStringLength(
          body.excerpt,
          EXCERPT_MAX_LENGTH,
          "Excerpt"
        );
        if (!excerptValidation.isValid) {
          set.status = 400;
          return { error: excerptValidation.error };
        }
        sanitizedExcerpt = sanitizePlainText(body.excerpt);
      }

      const storage = getCMSStorage(supabaseClient);
      const post = await storage.saveBlogPost({
        title: sanitizePlainText(body.title),
        slug: sanitizePlainText(body.slug),
        content: contentValidation.sanitized,
        excerpt: sanitizedExcerpt,
        authorId: user?.id || "unknown",
        published: body.published || false,
        tags: body.tags?.map((tag: string) => sanitizePlainText(tag)),
        featuredImage: body.featuredImage
          ? sanitizePlainText(body.featuredImage)
          : undefined,
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
    async ({ params: { id }, body, supabaseClient, set }) => {
      const updateData: any = {};

      // Validate and sanitize title if provided
      if (body.title !== undefined) {
        const titleValidation = validateStringLength(
          body.title,
          TITLE_MAX_LENGTH,
          "Title"
        );
        if (!titleValidation.isValid) {
          set.status = 400;
          return { error: titleValidation.error };
        }
        updateData.title = sanitizePlainText(body.title);
      }

      // Validate and sanitize slug if provided
      if (body.slug !== undefined) {
        const slugValidation = validateStringLength(
          body.slug,
          SLUG_MAX_LENGTH,
          "Slug"
        );
        if (!slugValidation.isValid) {
          set.status = 400;
          return { error: slugValidation.error };
        }
        updateData.slug = sanitizePlainText(body.slug);
      }

      // Validate and sanitize content if provided
      if (body.content !== undefined) {
        const contentValidation = validateAndSanitizeContent(body.content);
        if (!contentValidation.isValid) {
          set.status = 400;
          return { error: contentValidation.error };
        }
        updateData.content = contentValidation.sanitized;
      }

      // Validate and sanitize excerpt if provided
      if (body.excerpt !== undefined) {
        const excerptValidation = validateStringLength(
          body.excerpt,
          EXCERPT_MAX_LENGTH,
          "Excerpt"
        );
        if (!excerptValidation.isValid) {
          set.status = 400;
          return { error: excerptValidation.error };
        }
        updateData.excerpt = sanitizePlainText(body.excerpt);
      }

      // Handle other optional fields
      if (body.published !== undefined) {
        updateData.published = body.published;
      }
      if (body.tags !== undefined) {
        updateData.tags = body.tags.map((tag: string) =>
          sanitizePlainText(tag)
        );
      }
      if (body.featuredImage !== undefined) {
        updateData.featuredImage = body.featuredImage
          ? sanitizePlainText(body.featuredImage)
          : undefined;
      }

      const storage = getCMSStorage(supabaseClient);
      const updated = await storage.updateBlogPost(id, updateData);
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
    async ({ body, supabaseClient, set }) => {
      // Validate pageKey
      const keyValidation = validateStringLength(
        body.pageKey,
        KEY_MAX_LENGTH,
        "Page key"
      );
      if (!keyValidation.isValid) {
        set.status = 400;
        return { error: keyValidation.error };
      }

      // Validate title
      const titleValidation = validateStringLength(
        body.title,
        TITLE_MAX_LENGTH,
        "Title"
      );
      if (!titleValidation.isValid) {
        set.status = 400;
        return { error: titleValidation.error };
      }

      // Validate and sanitize description if provided
      let sanitizedDescription: string | undefined;
      if (body.description !== undefined) {
        const descValidation = validateStringLength(
          body.description,
          EXCERPT_MAX_LENGTH,
          "Description"
        );
        if (!descValidation.isValid) {
          set.status = 400;
          return { error: descValidation.error };
        }
        sanitizedDescription = sanitizePlainText(body.description);
      }

      const storage = getCMSStorage(supabaseClient);
      const config = await storage.savePageConfig({
        pageKey: sanitizePlainText(body.pageKey),
        title: sanitizePlainText(body.title),
        description: sanitizedDescription,
        config: body.config, // JSON config is validated by Elysia's type system
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
    async ({ params: { id }, body, supabaseClient, set }) => {
      const updateData: any = {};

      // Validate and sanitize pageKey if provided
      if (body.pageKey !== undefined) {
        const keyValidation = validateStringLength(
          body.pageKey,
          KEY_MAX_LENGTH,
          "Page key"
        );
        if (!keyValidation.isValid) {
          set.status = 400;
          return { error: keyValidation.error };
        }
        updateData.pageKey = sanitizePlainText(body.pageKey);
      }

      // Validate and sanitize title if provided
      if (body.title !== undefined) {
        const titleValidation = validateStringLength(
          body.title,
          TITLE_MAX_LENGTH,
          "Title"
        );
        if (!titleValidation.isValid) {
          set.status = 400;
          return { error: titleValidation.error };
        }
        updateData.title = sanitizePlainText(body.title);
      }

      // Validate and sanitize description if provided
      if (body.description !== undefined) {
        const descValidation = validateStringLength(
          body.description,
          EXCERPT_MAX_LENGTH,
          "Description"
        );
        if (!descValidation.isValid) {
          set.status = 400;
          return { error: descValidation.error };
        }
        updateData.description = sanitizePlainText(body.description);
      }

      // Handle config if provided
      if (body.config !== undefined) {
        updateData.config = body.config;
      }

      const storage = getCMSStorage(supabaseClient);
      const updated = await storage.updatePageConfig(id, updateData);
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
