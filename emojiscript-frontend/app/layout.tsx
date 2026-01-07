import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EmojiScript - Code with Emojis",
  description: "A modern emoji-based programming language transpiler",
  keywords: ["emojiscript", "emoji", "programming", "transpiler", "javascript"],
  authors: [{ name: "EmojiScript Team" }],
  creator: "EmojiScript",
  publisher: "EmojiScript",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://emojiscript.dev",
    title: "EmojiScript - Code with Emojis",
    description: "A modern emoji-based programming language transpiler",
    siteName: "EmojiScript",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmojiScript - Code with Emojis",
    description: "A modern emoji-based programming language transpiler",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
