import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inject Bypass",
  description: "Secure Licensing Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-bg text-foreground antialiased">{children}</body>
    </html>
  );
}
