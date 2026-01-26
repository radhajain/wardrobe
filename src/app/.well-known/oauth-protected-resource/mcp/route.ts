/**
 * OAuth Protected Resource Metadata
 * Tells MCP clients (like Claude Desktop) where to authenticate via Clerk
 *
 * See: RFC 9728 - OAuth 2.0 Protected Resource Metadata
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
    return await clerkHandler(request);
  } catch (error) {
    console.error("Protected resource metadata error:", error);
    return NextResponse.json(
      { error: "Failed to generate OAuth metadata" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  try {
    return corsHandler();
  } catch (error) {
    console.error("CORS handler error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
