import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { TerminalWindow } from "@phosphor-icons/react";

const TAG_COLOR = {
  think_tool: "text-warn",
  web_search: "text-accent",
  ConductResearch: "text-accent-bright",
  ResearchComplete: "text-ok",
  default: "text-mut",
};

export default function EventLog({ logs, running }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs.length]);

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <TerminalWindow size={15} weight="bold" className="text-accent" />
          事件日志
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-faint">
          {running && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
              streaming
            </>
          )}
          {logs.length} 条
        </span>
      </div>
      <div ref={ref} className="h-[260px] overflow-y-auto px-4 py-3 font-mono text-[11.5px] leading-[1.75]">
        {logs.length === 0 ? (
          <p className="text-faint">等待事件流入…</p>
        ) : (
          logs.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2"
            >
              <span className="shrink-0 text-faint">{l.at}</span>
              <span className="shrink-0 rounded bg-surface2 border border-line px-1 py-px text-[10px] text-mut">
                {l.actor}
              </span>
              <span
                className={`shrink-0 font-semibold ${TAG_COLOR[l.tag] || TAG_COLOR.default}`}
              >
                {l.tag}
              </span>
              <span className="min-w-0 break-words text-mut">{l.msg}</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
