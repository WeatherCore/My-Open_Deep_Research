import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Download, FileText, WarningCircle } from "@phosphor-icons/react";

export default function ReportView({ text, demo, streaming }) {
  const [copied, setCopied] = useState(false);
  const preview = useMemo(() => {
    if (!text) return [];
    const lines = text.split("\n");
    const head = [];
    for (const l of lines) {
      if (/^#{1,3} /.test(l) || /^\s*$/.test(l)) head.push(l);
      else break;
    }
    return head.slice(0, 3);
  }, [text]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!text) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <FileText size={16} weight="bold" className="text-accent" />
          最终报告
        </span>
        {demo && (
          <span className="flex items-center gap-1 rounded-md border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-warn">
            <WarningCircle size={12} weight="fill" />
            DEMO 演示数据
          </span>
        )}
        <span className="font-mono text-[11px] text-faint">
          {preview.map((l) => l.replace(/^#+\s*/, "")).filter(Boolean).slice(0, 2).join(" / ") || "研究结果"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {streaming && (
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
              生成中
            </span>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] text-mut transition-colors hover:border-line2 hover:text-tx"
          >
            {copied ? <Check size={13} weight="bold" className="text-ok" /> : <Copy size={13} />}
            {copied ? "已复制" : "复制"}
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] text-mut transition-colors hover:border-line2 hover:text-tx"
          >
            <Download size={13} />
            下载 .md
          </button>
        </div>
      </div>
      <div className="max-h-[640px] overflow-y-auto px-5 py-5 sm:px-7">
        <div className="report-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
