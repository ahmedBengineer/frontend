"use client";

import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentJsonObject } from "../types";

interface JsonInspectorProps {
  title: string;
  value: unknown;
  onApply?: (updated: AgentJsonObject) => void;
  readOnly?: boolean;
}

export function JsonInspector({
  title,
  value,
  onApply,
  readOnly,
}: JsonInspectorProps) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(v: string) {
    setText(v);
    setDirty(true);
    setError(null);
    setSaved(false);
  }

  function handleApply() {
    try {
      const parsed = JSON.parse(text);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setError("Root value must be a JSON object");
        return;
      }
      setError(null);
      setDirty(false);
      setSaved(true);
      onApply?.(parsed as AgentJsonObject);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(
        `JSON syntax error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  function handleReset() {
    setText(JSON.stringify(value, null, 2));
    setDirty(false);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold text-slate-400">
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Check className="h-3 w-3" /> Applied
            </span>
          )}
          {!readOnly && (
            <>
              {dirty && (
                <button
                  onClick={handleReset}
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleApply}
                disabled={!dirty}
                className={cn(
                  "rounded-md px-3 py-1 text-[11px] font-semibold transition",
                  dirty
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-[11px] text-red-700">{error}</p>
        </div>
      )}

      {/* Editor */}
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-xl border transition-colors",
          error
            ? "border-red-200 ring-1 ring-red-100"
            : dirty
              ? "border-indigo-200 ring-1 ring-indigo-100"
              : "border-slate-200",
        )}
      >
        <textarea
          className="h-full w-full resize-none bg-[#f8f9fb] p-4 font-mono text-[11px] leading-relaxed text-slate-700 outline-none"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
