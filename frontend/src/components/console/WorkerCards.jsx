import { motion } from "motion/react";
import {
  CheckCircle,
  CircleNotch,
  Lightning,
  MagnifyingGlass,
  Robot,
} from "@phosphor-icons/react";

/**
 * Live cards for the parallel researcher workers.
 * payload shapes:
 *   { kind: "start", payload: { topic } }
 *   { kind: "search", payload: { query, snippet } }
 *   { kind: "think",  payload: { reflection } }
 *   { kind: "done",   payload: { summary } }
 */
export default function WorkerCards({ workers }) {
  if (workers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {workers.map((w) => {
        const done = w.status === "done";
        return (
          <motion.div
            key={w.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  done
                    ? "border-accent/40 bg-accent-soft text-accent"
                    : "border-line text-mut"
                }`}
              >
                <Robot size={15} weight="bold" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  研究员 {String(w.id).padStart(2, "0")}
                  {done && <CheckCircle size={14} weight="fill" className="text-ok" />}
                </p>
                <p className="truncate text-[12px] text-mut">{w.topic}</p>
              </div>
              {!done && (
                <CircleNotch
                  size={15}
                  weight="bold"
                  className="animate-spin text-accent"
                />
              )}
            </div>

            <div className="space-y-2">
              {w.actions.map((a, i) => {
                if (a.kind === "search") {
                  return (
                    <div key={i} className="flex gap-2 text-[12px] leading-snug">
                      <MagnifyingGlass
                        size={13}
                        weight="bold"
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-tx">{a.query}</span>
                        {a.snippet && (
                          <p className="mt-0.5 text-mut">{a.snippet}</p>
                        )}
                      </div>
                    </div>
                  );
                }
                if (a.kind === "think") {
                  return (
                    <div
                      key={i}
                      className="rounded-lg border-l-2 border-warn/70 bg-surface2/60 px-2.5 py-1.5 text-[12px] leading-snug text-mut"
                    >
                      <span className="mr-1.5 font-mono text-[10.5px] font-semibold text-warn">
                        反思
                      </span>
                      {a.reflection}
                    </div>
                  );
                }
                if (a.kind === "done") {
                  return (
                    <div
                      key={i}
                      className="flex gap-2 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[12px] leading-snug text-tx"
                    >
                      <Lightning
                        size={13}
                        weight="fill"
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <span>{a.summary}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
