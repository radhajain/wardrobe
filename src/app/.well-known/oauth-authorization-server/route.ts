/**
 * OAuth 2.0 Authorization Server Metadata
 * Proxies Clerk's OAuth metadata with proper error handling
 *
 * The @clerk/mcp-tools library's handler lacks error handling,
 * so we fetch directly with timeout and proper error responses.
 */

import { NextResponse } from "next/server";

/**
 * Derive Clerk FAPI URL from publishable key
 * Same logic as @clerk/mcp-tools uses internally
 */
function deriveFapiUrl(publishableKey: string): string {
  const key = publishableKey.replace(/^pk_(test|live)_/, "");
  const decoded = Buffer.from(key, "base64").toString("utf8");
  return `https://${decoded.replace(/\$/, "")}`;
}

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    return NextResponse.json(
      { error: "OAuth not configured" },
      { status: 500 }
    );
  }

  try {
    const fapiUrl = deriveFapiUrl(publishableKey);

    // Fetch from Clerk with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${fapiUrl}/.well-known/oauth-authorization-server`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Clerk returned ${response.status}`);
    }

    const metadata = await response.json();

    return NextResponse.json(metadata, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "max-age=3600",
      },
    });
  } catch (error) {
    console.error("OAuth authorization server error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth metadata from Clerk" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
