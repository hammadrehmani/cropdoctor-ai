"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";

interface NavItem {
  href: string;
  label: string;
  labelUr: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

const PRIMARY_LINKS: NavItem[] = [
  { href: "/",             label: "Home",         labelUr: "ہوم",         icon: Icons.Home },
  { href: "/#services",    label: "Services",     labelUr: "خدمات",       icon: Icons.Layers },
  { href: "/#how-it-works",label: "How It Works", labelUr: "طریقہ کار",   icon: Icons.Zap },
  { href: "/risk-map",     label: "Risk Map",     labelUr: "رسک میپ",     icon: Icons.Map },
  { href: "/advisor",      label: "AI Advisor",   labelUr: "زرعی مشیر",   icon: Icons.Message },
  { href: "/dashboard",    label: "Dashboard",    labelUr: "ڈیش بورڈ",    icon: Icons.Dashboard },
];

const MORE_LINKS: NavItem[] = [
  { href: "/#what-we-do",      label: "What We Do",      labelUr: "ہمارا کام",     icon: Icons.Sparkles },
  { href: "/crops",           label: "Supported Crops", labelUr: "فصلیں",         icon: Icons.Leaf },
  { href: "/#our-story",       label: "Our Story",       labelUr: "ہماری کہانی",   icon: Icons.BookOpen },
  { href: "/#our-mission",     label: "Our Mission",     labelUr: "ہمارا مقصد",    icon: Icons.Target },
  { href: "/#trusted-advisor", label: "Trusted Sources", labelUr: "مستند ذرائع",   icon: Icons.ShieldCheck },
  { href: "/#faq",             label: "FAQ",             labelUr: "عام سوالات",    icon: Icons.HelpCircle },
];

const ALL_MOBILE_LINKS: NavItem[] = [
  ...PRIMARY_LINKS,
  ...MORE_LINKS,
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-2xl shadow-xl shadow-black/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo - Fixed single line */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl p-1 shrink-0 whitespace-nowrap"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-700/60 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors shadow-inner shrink-0">
              <Icons.Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col leading-none">
              <div className="text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap">
                <span className="text-emerald-400">AgriGuard</span>
                <span className="text-gray-300 font-light"> AI</span>
              </div>
              <span className="text-[10px] text-emerald-500/80 font-medium tracking-wide mt-0.5 whitespace-nowrap">
                Pakistan Crop Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Single line guaranteed */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 shrink-0">
            {PRIMARY_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href === "/" && pathname === "/");
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive && !link.href.includes("#")
                      ? "bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm"
                      : "text-gray-300 hover:text-emerald-300 hover:bg-gray-900/80"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 opacity-80 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* "More" Dropdown Menu for Secondary Sections */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  dropdownOpen
                    ? "bg-gray-900 text-emerald-300 border border-gray-700"
                    : "text-gray-300 hover:text-emerald-300 hover:bg-gray-900/80"
                }`}
                aria-expanded={dropdownOpen}
              >
                <span>About &amp; More</span>
                <span className="text-[10px] transition-transform duration-200">
                  {dropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-800 bg-gray-950/95 backdrop-blur-2xl p-2 shadow-2xl shadow-black/80 space-y-1 z-50 animate-fade-in-up">
                  {MORE_LINKS.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-emerald-300 hover:bg-gray-900 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-serif" dir="rtl">{item.labelUr}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Area - Clean single line */}
          <div className="hidden md:flex items-center gap-3 shrink-0 whitespace-nowrap">
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-900/90 border border-gray-800 px-2.5 py-1 rounded-full whitespace-nowrap">
              <Icons.Globe className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-medium">EN · اردو · سنڌي</span>
            </div>
            <Link
              href="/diagnose"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-950/80 glow-emerald whitespace-nowrap shrink-0"
            >
              <Icons.Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Scan Leaf</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="lg:hidden p-2.5 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-gray-900 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileOpen}
          >
            <span className="text-xl leading-none">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-gray-800/80 bg-gray-950/98 backdrop-blur-3xl px-4 py-3 space-y-1.5 animate-fade-in-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ALL_MOBILE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive && !link.href.includes("#")
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                      : "text-gray-300 hover:text-gray-100 hover:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-serif" dir="rtl">{link.labelUr}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 px-1">
            <div className="flex items-center gap-1.5">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Anonymous</span>
            </div>
            <Link
              href="/diagnose"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg whitespace-nowrap"
            >
              <Icons.Camera className="w-3.5 h-3.5" />
              <span>Scan Leaf</span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
