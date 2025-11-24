import { describe, expect, it } from "bun:test";

const BASE_URL = "http://localhost:8080";

describe("Image Compression Endpoint", () => {
  it("should compress an image", async () => {
    // Create a simple 1000x1000 SVG image to test with (sharp supports SVG input)
    const svgImage = `
      <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
        <rect width="1000" height="1000" fill="red" />
        <circle cx="500" cy="500" r="400" fill="blue" />
      </svg>
    `;
    const blob = new Blob([svgImage], { type: "image/svg+xml" });
    const formData = new FormData();
    formData.append("file", blob, "test.svg");

    const response = await fetch(`${BASE_URL}/image/compress`, {
      method: "POST",
      body: formData,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
    
    // We can't easily check the image dimensions without parsing the webp, 
    // but we can check if we got a valid response.
    console.log(`Compressed size: ${buffer.byteLength} bytes`);
  });
});
