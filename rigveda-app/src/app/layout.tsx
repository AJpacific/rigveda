import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Rig Veda",
  description: "The hosted site of the Rig Veda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <header className="global-header sticky top-0 z-40 border-b border-black/10 dark:border-white/10 backdrop-blur bg-white/70 dark:bg-black/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="header-title">Rig Veda</Link>
            <div className="flex items-center gap-4">
              <Link href="/search" className="header-link">Ask AI</Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
