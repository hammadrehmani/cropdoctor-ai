"use client";

import React from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
  isRtl?: boolean;
}

/**
 * Format inline markdown tokens: **bold**, *italic*, `code`
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex to split by bold (**text**), italic (*text*), and code (`text`)
  const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-emerald-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={i} className="italic text-gray-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono text-xs text-emerald-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Lightweight, robust Markdown Renderer for AI Advisor responses.
 * Formats bold, italics, ordered lists, bullet points, headers and notes with premium styling.
 */
export function MarkdownText({ content, className = "", isRtl = false }: MarkdownTextProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul_${elements.length}`} className="my-2 space-y-1.5 pl-4 list-disc list-outside marker:text-emerald-400">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol_${elements.length}`} className="my-2 space-y-1.5 pl-4 list-decimal list-outside marker:text-emerald-400 font-medium">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line -> paragraph separator
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headers: ### or ## or #
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4_${i}`} className="text-sm font-bold text-emerald-400 mt-3 mb-1">
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h3_${i}`} className="text-base font-extrabold text-emerald-300 mt-3 mb-1.5">
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={`h2_${i}`} className="text-lg font-black text-gray-100 mt-4 mb-2">
          {renderInline(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      continue;
    }

    // Bullet item: * item, - item, • item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered list: 1. item, 2. item
    const numberMatch = trimmed.match(/^\d+[\.)]\s+(.+)/);
    if (numberMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Regular paragraph line
    flushList();
    elements.push(
      <p key={`p_${i}`} className="my-1.5 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return (
    <div
      className={`text-sm leading-relaxed space-y-1 ${className}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {elements}
    </div>
  );
}
