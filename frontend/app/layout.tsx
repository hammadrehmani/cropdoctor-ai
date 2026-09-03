import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-urdu" });

export const metadata: Metadata = {
  title: "CropDoctor AI — AI-Powered Plant Disease & Pest Identification System for Smart Farming",
  description:
    "AI-powered plant disease & pest identification, explainable Grad-CAM triage, and 7-day meteorological risk mapping for smart farming in Pakistan.",
  keywords: "crop disease, pest identification, Pakistan agriculture, smart farming, AI farming, leaf disease detection, CropDoctor AI, Urdu agricultural advice",
  openGraph: {
    title: "CropDoctor AI",
    description: "AI-Powered Plant Disease & Pest Identification System for Smart Farming",
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
