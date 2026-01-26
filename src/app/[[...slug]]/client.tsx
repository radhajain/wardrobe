"use client";

import dynamic from "next/dynamic";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react";
import "@neondatabase/neon-js/ui/css";
import { authClient } from "../../auth/client";

// Dynamically import the entire app with router to avoid SSR issues
const AppWithRouter = dynamic(
  () =>
    Promise.all([import("../../App"), import("react-router-dom")]).then(
      ([mod, { BrowserRouter }]) => {
        const App = mod.default;
        return {
          default: () => (
            <BrowserRouter>
              <App />
            </BrowserRouter>
          ),
        };
      },
    ),
  { ssr: false },
);

export function ClientOnly() {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AppWithRouter />
    </NeonAuthUIProvider>
  );
}
