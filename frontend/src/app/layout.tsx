import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfinityCompress — Compress Anything. Convert Everything.",
  description: "A universal file compression and format conversion platform.",
  icons: {
    icon: "/favicon.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center">
        <main className="w-full max-w-5xl py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
