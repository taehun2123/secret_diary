import type { Metadata } from "next";
import "./globals.css";
import SpotifyProvider from "@/components/SpotifyProvider";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "My Secret Diary",
  description: "A cute and private daily space.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <SpotifyProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </SpotifyProvider>
      </body>
    </html>
  );
}
