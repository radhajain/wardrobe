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
    const response = await clerkHandler();
    if (!response) {
      console.error("clerkHandler returned undefined");
      return NextResponse.json(
        { error: "OAuth metadata unavailable" },
        { status: 500 }
      );
    }
    return response;
  } catch (error) {
    console.error("OAuth authorization server metadata error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth metadata" },
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
