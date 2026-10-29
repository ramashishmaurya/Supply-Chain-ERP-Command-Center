"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import { sendCopilotChat } from "@/lib/api";
import { ToolCallLog } from "@/lib/types";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Terminal
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools_executed?: ToolCallLog[];
  suggested_action?: Record<string, any>;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Which products are at critical risk of running out of stock?",
  "Which suppliers have the longest lead times?",
  "What should we reorder this week?",
  "Explain why SKU-ARM-X900 is considered high risk",
  "Show open purchase orders in the system"
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content: 
        "Hello! I am your **SupplyChain Copilot AI**. I monitor inventory risks, calculate deterministic Reorder Points (ROP), analyze supplier delivery performance, and prepare purchase order drafts.\n\n" +
        "How can I assist your procurement operations today?",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendCopilotChat(textToSend, historyPayload);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        tools_executed: response.tools_executed,
        suggested_action: response.suggested_action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error contacting Copilot service: ${err.message}. Please check backend connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        title="AI Supply Chain Copilot"
        subtitle="Grounded Natural Language Assistant with Controlled Tool Calling & ROP Diagnostics"
      />

      <main className="p-8 flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full">
        {/* Chat Message Window */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm"
                }`}
              >
                {/* Tool Execution Badges */}
                {m.tools_executed && m.tools_executed.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>Deterministic Tool Execution Log:</span>
                    </div>
                    {m.tools_executed.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
                        <span>call: {t.tool_name}({JSON.stringify(t.arguments)})</span>
                        <span className="text-[10px] text-slate-500">{t.result_summary}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Rendered */}
                <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                  {m.content}
                </div>

                {/* Suggested Action Pill */}
                {m.suggested_action && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Action Recommended</span>
                    </div>
                    <Link
                      href="/purchase-orders"
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                    >
                      <span>Review in PO Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                <div
                  className={`text-[10px] ${
                    m.role === "user" ? "text-blue-200 text-right" : "text-slate-500"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                Evaluating deterministic tools & query context...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Quick Prompts:
          </span>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition disabled:opacity-50 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot about inventory risks, supplier performance, or replenishment orders..."
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </main>
    </>
  );
}
