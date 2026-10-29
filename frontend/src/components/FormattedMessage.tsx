"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function FormattedMessage({ content }: Props) {
  return (
    <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Styled Tables
          table: ({ node, ...props }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-700/70 dark:border-slate-800 bg-slate-950/70 dark:bg-slate-950 shadow-md">
              <table className="w-full text-left border-collapse text-[11px]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-900/90 dark:bg-slate-900 text-slate-200 border-b border-slate-700/80 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="py-2.5 px-3 font-bold text-slate-200 whitespace-nowrap" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/80" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-800/40 transition-colors" {...props} />
          ),
          td: ({ node, children, ...props }) => {
            const str = String(children);
            // Highlight critical/high urgency
            const isCritical = str.toLowerCase().includes("critical") || str.toLowerCase().includes("deplete");
            const isDays = /\b\d+(\.\d+)?\s*days?\b/i.test(str);

            return (
              <td className="py-2.5 px-3 text-slate-300 align-middle" {...props}>
                {isCritical ? (
                  <span className="text-red-300 font-medium">{children}</span>
                ) : isDays ? (
                  <span className="font-mono font-semibold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                    {children}
                  </span>
                ) : (
                  children
                )}
              </td>
            );
          },

          // Headers
          h3: ({ node, ...props }) => (
            <h3 className="text-sm font-bold text-slate-100 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-800 flex items-center gap-1.5" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-bold text-blue-400 mt-3 mb-1" {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="space-y-1.5 my-2.5 pl-4 list-disc text-slate-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="space-y-1.5 my-2.5 pl-4 list-decimal text-slate-300" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-slate-300 dark:text-slate-200" {...props} />
          ),

          // Strong / Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-100 dark:text-white" {...props} />
          ),

          // Inline Code & SKU highlights
          code: ({ node, className, children, ...props }) => {
            const isSku = String(children).startsWith("SKU-");
            return (
              <code
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  isSku
                    ? "bg-blue-950 text-blue-300 border border-blue-800/70 font-bold"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/60"
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-3 py-1 my-2 bg-blue-950/20 text-slate-300 rounded-r-lg italic" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
