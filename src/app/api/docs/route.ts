import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openapi: "3.0.0",
    info: {
      title: "Inject Bypass API",
      version: "1.0.0"
    },
    paths: {
      "/api/auth/login": { post: { summary: "Login" } },
      "/api/auth/2fa/setup": { post: { summary: "Setup 2FA" } },
      "/api/auth/2fa/verify": { post: { summary: "Verify 2FA token" } },
      "/api/licenses/validate": { post: { summary: "Validate license" } },
      "/api/products": { get: { summary: "List products" }, post: { summary: "Create product" } },
      "/api/products/{id}": { put: { summary: "Update product" }, delete: { summary: "Delete product" } },
      "/api/licenses/{id}": { put: { summary: "Update license" }, delete: { summary: "Delete license" } },
      "/api/users/{id}": { put: { summary: "Update user" }, delete: { summary: "Delete user" } }
    }
  });
}
