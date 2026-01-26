/**
 * OAuth 2.0 Authorization Server Metadata
 * Uses Clerk as the OAuth provider for Claude Desktop
 */

import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

const handler = authServerMetadataHandlerClerk();
const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
