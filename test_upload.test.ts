import { describe, expect, it } from "bun:test";
import app from "./src/index";

describe("Upload Image", () => {
  it("should upload an image successfully", async () => {
    const file = new File(["fake image content"], "test-image.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for server to start
    const response = await fetch("http://127.0.0.1:3000/image/upload", {
      method: "POST",
      body: formData,
    });

    const body = await response.json();
    if (response.status !== 200) {
      console.log("Error response:", JSON.stringify(body, null, 2));
    }
    expect(response.status).toBe(200);
    expect(body).toHaveProperty("message", "Image uploaded successfully");
    expect(body).toHaveProperty("filename");
    console.log("Upload response:", body);
  });
});
