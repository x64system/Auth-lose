import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider, themeInitScript } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: "Inject Bypass",
  description: "Secure Licensing Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-bg text-foreground antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
