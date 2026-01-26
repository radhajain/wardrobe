/**
 * OAuth Protected Resource Metadata
 * Tells MCP clients (like Claude Desktop) where to authenticate via Clerk
 *
 * See: RFC 9728 - OAuth 2.0 Protected Resource Metadata
 */

import {
  protectedResourceHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

const handler = protectedResourceHandlerClerk({
  scopes_supported: ["wardrobe:read", "wardrobe:write"],
});

const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
