import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openapi: "3.0.0",
    info: {
      title: "Inject Bypass API",
      version: "1.0.0"
    },
    paths: {
      "/api/auth/register": { post: { summary: "Register (public)" } },
      "/api/auth/login": { post: { summary: "Login (public, may return requires2FA)" } },
      "/api/auth/2fa/login": { post: { summary: "Complete login when 2FA is enabled (public)" } },
      "/api/auth/logout": { post: { summary: "Logout (session required)" } },
      "/api/auth/refresh": { post: { summary: "Refresh session (session required)" } },
      "/api/auth/2fa/setup": { post: { summary: "Setup 2FA (session required)" } },
      "/api/auth/2fa/verify": { post: { summary: "Verify 2FA token and enable it (session required)" } },
      "/api/licenses/validate": { post: { summary: "Validate license (public)" } },
      "/api/products": { get: { summary: "List products (SUPPORT+)" }, post: { summary: "Create product (DEVELOPER+)" } },
      "/api/products/{id}": { put: { summary: "Update product (DEVELOPER+)" }, delete: { summary: "Delete product (DEVELOPER+)" } },
      "/api/licenses": { get: { summary: "List licenses (SUPPORT+)" }, post: { summary: "Create license (MODERATOR+)" } },
      "/api/licenses/{id}": { put: { summary: "Update license (MODERATOR+)" }, delete: { summary: "Delete license (MODERATOR+)" } },
      "/api/users": { get: { summary: "List users (ADMIN+)" } },
      "/api/users/{id}": { put: { summary: "Update user (ADMIN+)" }, delete: { summary: "Delete user (ADMIN+)" } },
      "/api/users/me": { get: { summary: "Own profile (session required)" }, patch: { summary: "Update own profile (session required)" } },
      "/api/logs": { get: { summary: "Audit log (ADMIN+)" } },
      "/api/notifications": { get: { summary: "Notifications (session required)" } },
      "/api/stats": { get: { summary: "Dashboard stats (SUPPORT+)" } },
      "/api/analytics": { get: { summary: "Analytics (SUPPORT+)" } },
      "/api/payments": { get: { summary: "Payment gateways (SUPPORT+)" } }
    }
  });
}
