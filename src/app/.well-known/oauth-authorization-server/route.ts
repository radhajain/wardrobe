/**
 * OAuth 2.0 Authorization Server Metadata
 * Uses Clerk as the OAuth provider for Claude Desktop
 */

import { NextResponse } from "next/server";
import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

const clerkHandler = authServerMetadataHandlerClerk();
const corsHandler = metadataCorsOptionsRequestHandler();

export async function GET() {
  try {
    return await clerkHandler();
  } catch (error) {
    console.error("OAuth authorization server metadata error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth metadata" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  try {
    return corsHandler();
  } catch (error) {
    console.error("CORS handler error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
