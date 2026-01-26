import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that should be publicly accessible (no auth required)
// These routes handle their own authentication or serve public metadata
const isPublicRoute = createRouteMatcher([
  // OAuth metadata endpoints for MCP clients (Claude Desktop)
  "/.well-known/oauth-authorization-server(.*)",
  "/.well-known/oauth-protected-resource(.*)",
  // MCP endpoint handles its own OAuth token verification
  "/api/mcp(.*)",
  // API key management endpoints
  "/api/keys(.*)",
  // OAuth registration endpoint
  "/register(.*)",
  // Main app routes (allow access, Clerk UI handles auth)
  "/",
  "/pieces(.*)",
  "/outfits(.*)",
  "/builder(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without protection
  if (isPublicRoute(req)) return;

  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    // BUT include .well-known and api routes for Clerk context
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
