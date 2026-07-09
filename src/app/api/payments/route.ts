import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    gateways: ["Stripe", "PayPal", "PIX", "Crypto"],
    status: "integration-ready"
  });
}
