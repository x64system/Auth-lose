import { NextResponse } from "next/server";
import { requireRole } from "@/lib/security/guards";

export async function GET() {
  const auth = await requireRole("SUPPORT");
  if (auth.response) return auth.response;

  return NextResponse.json({
    gateways: ["Stripe", "PayPal", "PIX", "Crypto"],
    status: "integration-ready"
  });
}
