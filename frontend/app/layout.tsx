import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-urdu" });

export const metadata: Metadata = {
  title: "AgriGuard AI — Crop Disease Intelligence for Pakistan",
  description:
    "AI-powered crop disease detection, multilingual advisory chat, and district-level risk mapping for Pakistani farmers. Supports cotton, wheat, rice, and sugarcane.",
  keywords: "crop disease, Pakistan agriculture, AI farming, leaf disease detection, Urdu agricultural advice",
  openGraph: {
    title: "AgriGuard AI",
    description: "Agricultural disease intelligence platform for Pakistan",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${urdu.variable} font-sans bg-gray-950 text-gray-100 min-h-screen flex flex-col relative overflow-x-hidden`}>
        {/* Ambient luminous frosted glass background orbs */}
        <div className="ambient-glow-1" aria-hidden="true" />
        <div className="ambient-glow-2" aria-hidden="true" />
        <div className="ambient-glow-3" aria-hidden="true" />

        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
