import { Elysia, t } from "elysia";
import sharp from "sharp";
import { z } from "zod";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";
import { InMemoryStorage } from "./storage";
import { authPlugin, requireAuth } from "./auth";
import { cmsPlugin } from "./cms";
import {
  supabase,
  testSupabaseConnection,
  createAuthenticatedClient,
} from "./supabase";

const storage = new InMemoryStorage();

const app = new Elysia({
  prefix: "/api/v1",
  normalize: true,
  cookie: {
    secrets: "Fischl von Luftschloss Narfidort",
    sign: ["profile"],
  },
})
  .use(
    cors({
      origin: [
        "https://sienna-cms-web.natanael280198.workers.dev",
        "http://localhost:5173",
      ],
      credentials: true, // Allow cookies and authorization headers
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    openapi({
      references: fromTypes(),
      documentation: {
        info: {
          title: "Elysia API Documentation! :)",
          version: "1.0.0",
          description: "API documentation for the Elysiaapplication",
        },
      },
      mapJsonSchema: {
        zod: z.toJSONSchema,
        valibot: toJsonSchema,
      },
    })
  )
  .use(authPlugin)
  .derive(async ({ headers }) => {
    // Extract token from Authorization header and verify with Supabase
    const authHeader = (headers as Record<string, string | undefined>)
      .authorization;

    if (!authHeader || typeof authHeader !== "string") {
      return {
        user: null,
        supabaseClient: supabase, // Return unauthenticated client
      };
    }

    // Check if it starts with "Bearer " (case-insensitive)
    const normalizedHeader = authHeader.trim();
    const bearerPrefix = normalizedHeader.substring(0, 7).toLowerCase();
    if (bearerPrefix !== "bearer ") {
      return {
        user: null,
        supabaseClient: supabase,
      };
    }

    const token = normalizedHeader.substring(7).trim();
    if (!token || !supabase) {
      return {
        user: null,
        supabaseClient: supabase,
      };
    }

    try {
      // Verify token with Supabase
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return {
          user: null,
          supabaseClient: supabase,
        };
      }

      // Create authenticated Supabase client
      const authenticatedClient = createAuthenticatedClient(token);

      return {
        user: {
          id: data.user.id,
          email: data.user.email || undefined,
          ...data.user.user_metadata,
        },
        supabaseClient: authenticatedClient || supabase,
      };
    } catch (error) {
      // Token verification failed
      return {
        user: null,
        supabaseClient: supabase,
      };
    }
  })
  .use(cmsPlugin)
  .get("/", () => "Hello Elysia")
  .post("/set-cookie", ({ cookie: { profile } }) => {
    profile.value = "some-profile-data";
    profile.httpOnly = true;
    profile.sameSite = "strict";
    return { message: "Cookie set" };
  })
  .get("/check-cookie", ({ cookie: { "x-header": xHeader, profile } }) => {
    xHeader.domain = "example.com";

    return {
      domain: xHeader.domain, // if a value is null, it automatically omitted from the response JSON
      xHeader: (xHeader.value += "<insert>"),
      secrets: profile.value,
    };
  })
  .get("/health", () => "OK")
  .get(
    "/auth/me",
    ({ user }) => {
      return {
        user: user || null,
      };
    },
    {
      detail: {
        summary: "Get current authenticated user",
        tags: ["Auth"],
      },
    }
  )
  .post("/form", ({ body }) => body)
  .get("/user/:id", ({ params: { id } }) => id, {
    params: t.Object({
      id: t.Number(),
    }),
  })
  .get(
    "/id/:id",
    ({ params: { id }, query: { name } }) => {
      return {
        id,
        name,
      };
    },
    {
      params: z.object({
        id: z.coerce.number(),
      }),
      query: v.object({
        name: v.literal("Lilith"), // this means the name query parameter must be "Lilith"
      }),
    }
  )
  .post(
    "/image/compress",
    async ({ body: { file } }) => {
      const buffer = await file.arrayBuffer();
      const compressed = await sharp(buffer)
        .resize(800) // Resize to max width 800px
        .webp({ quality: 80 }) // Convert to WebP with 80% quality
        .toBuffer();

      return new Response(compressed as Buffer as BodyInit, {
        headers: {
          "Content-Type": "image/webp",
        },
      });
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      beforeHandle: requireAuth,
    }
  )
  .post(
    "/image/upload",
    async ({ body: { file } }) => {
      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}-${file.name}`;
      await storage.save(filename, Buffer.from(buffer));
      return {
        message: "Image uploaded successfully",
        filename,
      };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      beforeHandle: requireAuth,
    }
  )
  .get(
    "/images",
    async () => {
      const filenames = await storage.list();
      return {
        images: filenames,
        count: filenames.length,
      };
    },
    {
      beforeHandle: requireAuth,
    }
  )
  .get("/image/:filename", async ({ params: { filename } }) => {
    const image = await storage.get(filename);
    if (!image) {
      return new Response("Image not found", { status: 404 });
    }

    // Detect content type from filename extension
    const extension = filename.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    const contentType = contentTypeMap[extension || ""] || "image/jpeg";

    return new Response(image as BodyInit, {
      headers: {
        "Content-Type": contentType,
      },
    });
  });

// Test database connection on startup
(async () => {
  await testSupabaseConnection();
  console.log(`🦊 Elysia is running at port: ${process.env.PORT || 3001}`);
})();

export default app;
