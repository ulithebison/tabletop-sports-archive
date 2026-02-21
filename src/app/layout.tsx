import type { Metadata } from "next";
import { Oswald, Inter, DM_Mono, Lora } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

export const metadata: Metadata = {
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
      className={`${oswald.variable} ${inter.variable} ${dmMono.variable} ${lora.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-ink-950 text-ink-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
