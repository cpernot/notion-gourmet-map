import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "グルメマップ",
  description: "Notionデータベースとリアルタイム連携したインタラクティブな店舗マップ",
  icons: {
    icon: "/coffee.png",
    apple: "/coffee.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "グルメマップ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-950`}>
        {children}
      </body>
    </html>
  );
}
