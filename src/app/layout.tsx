import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "../index.css";

export const metadata: Metadata = {
  title: "Wardrobe",
  description: "Your personal wardrobe manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <div id="root">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
