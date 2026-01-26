/**
 * OAuth Protected Resource Metadata (Base Path)
 * Tells MCP clients (like Claude Desktop) where to authenticate via Clerk
 *
 * See: RFC 9728 - OAuth 2.0 Protected Resource Metadata
 *
 * Note: This serves the same metadata as the /mcp subpath route.
 * Some MCP clients may hit this base path instead of the /mcp subpath.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  protectedResourceHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

const clerkHandler = protectedResourceHandlerClerk({
  scopes_supported: ["profile", "email"],
});

const corsHandler = metadataCorsOptionsRequestHandler();

export async function GET(request: NextRequest) {
  try {
    const response = await clerkHandler(request);
    if (!response) {
      console.error("protectedResourceHandlerClerk returned undefined");
      return NextResponse.json(
        { error: "OAuth metadata unavailable" },
        { status: 500 }
      );
    }
    return response;
  } catch (error) {
    console.error("Protected resource metadata error:", error);
    return NextResponse.json(
      { error: "Failed to generate OAuth metadata" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  const response = corsHandler();
  if (!response) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  return response;
}
