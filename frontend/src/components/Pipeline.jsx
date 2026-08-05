import { motion } from "motion/react";
import { Check, CircleNotch } from "@phosphor-icons/react";
import { STAGES } from "../lib/constants.js";

const STATUS_META = {
  pending: { icon: null, cls: "border-line text-faint" },
  running: { icon: "spinner", cls: "border-accent text-accent" },
  done: { icon: "check", cls: "border-accent/40 bg-accent-soft text-accent" },
  error: { icon: "err", cls: "border-danger text-danger" },
};

export default function Pipeline({ statuses }) {
  const order = STAGES.map((s) => s.id);
  const doneCount = order.filter((id) => statuses[id] === "done").length;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold">研究流程</span>
        <span className="font-mono text-[11.5px] text-faint">
          {doneCount}/{order.length}
        </span>
      </div>

      <ol className="relative">
        {STAGES.map((s, i) => {
          const st = statuses[s.id] || "pending";
          const meta = STATUS_META[st];
          const isLast = i === STAGES.length - 1;
          return (
            <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[13px] top-[30px] h-[calc(100%-26px)] w-px ${
                    statuses[STAGES[i + 1]?.id] === "done" || st === "done"
                      ? "bg-accent/50"
                      : "bg-line"
                  }`}
                />
              )}
              <motion.span
                initial={false}
                animate={
                  st === "running"
                    ? { scale: [1, 1.12, 1] }
                    : { scale: 1 }
                }
                transition={
                  st === "running"
                    ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
                    : { duration: 0.25 }
                }
                className={`z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border ${
                  meta.cls
                } ${st === "running" ? "shadow-[0_0_0_5px_var(--accent-soft)]" : ""}`}
              >
                {st === "running" ? (
                  <CircleNotch size={13} weight="bold" className="animate-spin" />
                ) : st === "done" ? (
                  <Check size={13} weight="bold" />
                ) : st === "error" ? (
                  <span className="text-[12px] leading-none">!</span>
                ) : (
                  <span className="font-mono text-[10.5px]">{i + 1}</span>
                )}
              </motion.span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-[13px] font-medium leading-tight ${
                    st === "pending" ? "text-faint" : "text-tx"
                  }`}
                >
                  {s.label}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10.5px] text-faint">
                  {s.en}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
