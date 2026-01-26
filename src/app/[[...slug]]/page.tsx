import { ClientOnly } from "./client";

// Force dynamic rendering for all routes (React Router handles client-side routing)
export const dynamic = "force-dynamic";

export default function Page() {
  return <ClientOnly />;
}
