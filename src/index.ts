import { Elysia, t } from "elysia";
import sharp from "sharp";
import { z } from "zod";
import { fromTypes, openapi } from "@elysiajs/openapi";
import * as v from "valibot";
import { InMemoryStorage } from "./storage";

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
    openapi({
      references: fromTypes(),
    })
  )
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
    }
  )
  .get("/images", async () => {
    const filenames = await storage.list();
    return {
      images: filenames,
      count: filenames.length,
    };
  })
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

console.log(`🦊 Elysia is running at port: ${process.env.PORT || 3001}`);

export default app;
