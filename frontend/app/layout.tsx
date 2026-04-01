import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfinityCompress — Compress Anything. Convert Everything.",
  description: "A universal file compression and format conversion platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0b0f1a] text-white">
        <main className="container mx-auto px-4 py-12 max-w-5xl">
          {children}
        </main>
      </body>
    </html>
  );
}
