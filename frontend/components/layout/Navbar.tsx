"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/ui/Icons";

interface NavItem {
  href: string;
  label: string;
  icon?: (props: { className?: string; style?: React.CSSProperties }) => React.JSX.Element;
  badge?: string;
}

const PRIMARY_LINKS: NavItem[] = [
  { href: "/",             label: "Home",         icon: Icons.Home },
  { href: "/diagnose",     label: "Disease Prediction", icon: Icons.Scan, badge: "POPULAR" },
  { href: "/advisor",      label: "AI Advisor",   icon: Icons.Message, badge: "AI" },
];

const MORE_LINKS: NavItem[] = [
  { href: "/#what-we-do",      label: "What We Do",      icon: Icons.Sparkles },
  { href: "/risk-map",         label: "Risk Map",        icon: Icons.Map },
  { href: "/dashboard",        label: "Dashboard",       icon: Icons.Dashboard },
  { href: "/crops",            label: "Supported Crops", icon: Icons.Leaf },
  { href: "/#our-story",       label: "About",           icon: Icons.BookOpen },
  { href: "/#faq",             label: "FAQ",             icon: Icons.HelpCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#1a3626" }}
            >
              <Icons.Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <div className="text-base font-extrabold tracking-tight text-gray-900 whitespace-nowrap">
                CropDoctor
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: "#4a9a6b" }}>
                Smart Farming Made Simple
              </span>
            </div>
          </Link>

          {/* Desktop Navigation — Pill-style like Croplyx */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1">
            {PRIMARY_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150"
                  style={{
                    background: isActive ? "#F0EDE5" : "transparent",
                    color: isActive ? "#1a3626" : "#374151",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8F6F0";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {IconComp && <IconComp className="w-4 h-4 opacity-70 shrink-0" />}
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: link.badge === "AI" ? "#1a3626" : "#FEF3C7",
                        color: link.badge === "AI" ? "#fff" : "#92400E",
                      }}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer"
                style={{ color: "#374151" }}
                aria-expanded={dropdownOpen}
              >
                <span>About</span>
                <Icons.ChevronDown
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.6 }}
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-52 rounded-2xl p-1.5 space-y-0.5 z-50 animate-fade-in-up"
                  style={{
                    background: "rgba(255,255,255,0.98)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {MORE_LINKS.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#F0EDE5"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        {ItemIcon && <ItemIcon className="w-4 h-4 shrink-0" style={{ color: "#4a9a6b" }} />}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right — Contact + CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <span
              className="text-sm font-medium text-gray-500 hidden xl:block cursor-default"
              style={{ color: "#6B7280" }}
            >
              Contact
            </span>
            <Link
              href="/diagnose"
              className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full whitespace-nowrap shrink-0 transition-all"
              style={{ background: "#1a3626", color: "#ffffff" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#243b2f"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "#1a3626"}
            >
              <Icons.Camera className="w-4 h-4 shrink-0" />
              Try Free Demo
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl cursor-pointer shrink-0"
            style={{ background: "#F0EDE5", color: "#1a3626" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileOpen}
          >
            <span className="text-xl leading-none">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden px-4 py-4 space-y-1 animate-fade-in-up"
          style={{ background: "rgba(255,255,255,0.98)", borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          {[...PRIMARY_LINKS, ...MORE_LINKS].map((link) => {
            const isActive = pathname === link.href;
            const IconComp = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: isActive ? "#F0EDE5" : "transparent",
                  color: isActive ? "#1a3626" : "#374151",
                }}
              >
                {IconComp && <IconComp className="w-4 h-4 shrink-0" style={{ color: "#4a9a6b" }} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <Link
              href="/diagnose"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "#1a3626" }}
            >
              <Icons.Camera className="w-4 h-4" />
              Try Free Demo
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
