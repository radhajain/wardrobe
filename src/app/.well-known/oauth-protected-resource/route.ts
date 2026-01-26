/**
 * OAuth Protected Resource Metadata (Base Path)
 * Tells MCP clients (like Claude Desktop) where to authenticate via Clerk
 *
 * See: RFC 9728 - OAuth 2.0 Protected Resource Metadata
 *
 * Generates metadata directly instead of using Clerk handler,
 * since the Clerk handler fails without session context.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Derive Clerk FAPI URL from publishable key
 * Same logic as @clerk/mcp-tools uses internally
 */
function deriveFapiUrl(publishableKey: string): string {
  const key = publishableKey.replace(/^pk_(test|live)_/, "");
  const decoded = Buffer.from(key, "base64").toString("utf8");
  return `https://${decoded.replace(/\$/, "")}`;
}

export async function GET(request: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    return NextResponse.json(
      { error: "OAuth not configured" },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;
  const fapiUrl = deriveFapiUrl(publishableKey);

  // Generate OAuth Protected Resource Metadata (RFC 9728)
  const metadata = {
    resource: origin,
    authorization_servers: [fapiUrl],
    scopes_supported: ["profile", "email"],
    token_types_supported: ["urn:ietf:params:oauth:token-type:access_token"],
    token_introspection_endpoint: `${fapiUrl}/oauth/token`,
    token_introspection_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
    ],
    jwks_uri: `${fapiUrl}/.well-known/jwks.json`,
    authorization_data_types_supported: ["oauth_scope"],
    authorization_data_locations_supported: ["header", "body"],
    key_challenges_supported: [
      {
        challenge_type: "urn:ietf:params:oauth:pkce:code_challenge",
        challenge_algs: ["S256"],
      },
    ],
    service_documentation: "https://clerk.com/docs",
  };

  return NextResponse.json(metadata, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "max-age=3600",
    },
  });
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
