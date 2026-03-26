import type { Metadata } from "next";
import "./globals.css";
import SpotifyProvider from "@/components/SpotifyProvider";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Subin World",
  description: "수빈이는 귀엽기떄문에 비밀 다이어리를 쓴다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <SpotifyProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </SpotifyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
