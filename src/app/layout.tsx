import type { Metadata } from "next";
import { Oswald, Inter, DM_Mono, Lora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Script from "next/script";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

// Bundled in the repo (OFL-1.1, from @fontsource-variable/jetbrains-mono 5.3.0).
// The Google Fonts download of JetBrains Mono broke a Coolify build once.
const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono-latin-variable.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-jetbrains",
  display: "swap",
  fallback: ["ui-monospace", "Courier New", "monospace"],
  adjustFontFallback: false, // the default Arial-based fallback is not monospace
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Tabletop Sports Games Archive",
    template: "%s | Tabletop Sports Games Archive",
  },
  description:
    "The definitive archive of physical tabletop sports simulation games. Browse 6,800+ board games, dice games, and card games covering every sport.",
  keywords: ["tabletop games", "sports games", "board games", "simulation games", "dice games"],
  openGraph: {
    type: "website",
    siteName: "Tabletop Sports Games Archive",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${inter.variable} ${dmMono.variable} ${lora.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-ink-950 text-ink-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Script
          src="https://stats.tabletopsportsarchive.com/script.js"
          data-website-id="dd8cffdc-9b37-4a9a-99bf-3ea5f5e76913"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
