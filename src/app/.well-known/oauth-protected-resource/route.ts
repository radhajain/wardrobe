/**
 * OAuth Protected Resource Metadata Endpoint
 * Tells MCP clients (like Claude Desktop) where to authenticate
 *
 * See: RFC 9728 - OAuth 2.0 Protected Resource Metadata
 * https://datatracker.ietf.org/doc/html/rfc9728
 */

import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(request: Request) {
  const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;

  if (!neonAuthUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_NEON_AUTH_URL not configured" },
      { status: 500, headers: corsHeaders }
    );
  }

  const url = new URL(request.url);
  const resourceUrl = `${url.protocol}//${url.host}/api/mcp`;

  // OAuth Protected Resource Metadata (RFC 9728)
  const metadata = {
    resource: resourceUrl,
    authorization_servers: [neonAuthUrl],
    scopes_supported: ["wardrobe:read", "wardrobe:write"],
  };

  return NextResponse.json(metadata, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
