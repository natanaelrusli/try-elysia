import { Elysia, t } from "elysia";
import sharp from "sharp";
import { z } from "zod";
import { fromTypes, openapi } from "@elysiajs/openapi";
import * as v from "valibot";

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
    })
  )
  .get("/", () => "Hello Elysia")
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
  .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export default app;

