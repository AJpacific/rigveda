import type { Metadata } from "next";
import "./globals.css";
import GlobalHeader from "./components/GlobalHeader";

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <GlobalHeader />
        <main className="container mx-auto px-4 py-6 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
