
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that should be publicly accessible (no auth required)
const isPublicRoute = createRouteMatcher([
  // OAuth metadata endpoints for MCP clients (Claude Desktop)
  "/.well-known/oauth-authorization-server(.*)",
  "/.well-known/oauth-protected-resource(.*)",
  // MCP endpoint itself handles its own auth
  "/api/mcp(.*)",
  // API key management endpoints
  "/api/keys(.*)",
  // Other API routes
  "/api/(.*)",
  // Main app routes (Neon Auth handles these)
  "/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without protection
  if (isPublicRoute(req)) return;

  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and .well-known (OAuth metadata)
    "/((?!_next|.well-known|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
