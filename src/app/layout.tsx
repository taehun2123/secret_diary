import type { Metadata } from "next";
import "./globals.css";
import SpotifyProvider from "@/components/SpotifyProvider";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Subin World",
  description: "수빈이는 귀엽기떄문에 비밀 다이어리를 쓴다.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Subin World",
  },
  icons: {
    icon: [
      { url: "/assets/duck.png" },
      { url: "/assets/duck_v8.png", sizes: "192x192" },
      { url: "/assets/duck_v11.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/assets/duck.png" },
      { url: "/assets/duck_v8.png", sizes: "180x180" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: "#FFE082",
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
