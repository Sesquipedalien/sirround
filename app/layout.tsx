import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RemoteNav from "./components/RemoteNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sirround.me"),
  title: {
    default: "Sirround",
    template: "%s | Sirround",
  },
  description: "Spatial audio, ambisonics, and immersive sound design.",
  openGraph: {
    title: "Sirround",
    description: "Spatial audio, ambisonics, and immersive sound design.",
    url: "https://sirround.me",
    siteName: "Sirround",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sirround",
    description: "Spatial audio, ambisonics, and immersive sound design.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-black text-white">
      <body className="h-full">
        <RemoteNav />
        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* GA4 (only when NEXT_PUBLIC_GA_ID is set) */}
          {process.env.NEXT_PUBLIC_GA_ID ? (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);} 
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
                `}
              </Script>
            </>
          ) : null}
        </div>
        {/* Accent top border bar: green → yellow → red */}
        <div className="h-1 w-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/IMG_0864.JPG" alt="Sirround logo" width={32} height={32} className="rounded logo" />
              <span className="text-lg font-semibold tracking-tight">Sirround</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-300">
              <Link href="/audio-demos" className="hover:text-white" data-focusable="true">Spatial Audio Demos</Link>
              <Link href="/about" className="hover:text-white" data-focusable="true">About</Link>
              <Link href="/contact" className="hover:text-white" data-focusable="true">Contact</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Sirround. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
