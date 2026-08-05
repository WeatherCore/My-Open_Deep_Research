import { motion } from "motion/react";
import { Cpu, Globe, ListChecks, PuzzlePiece } from "@phosphor-icons/react";
import { CONFIG_GROUPS } from "../lib/constants.js";

const GROUP_ICONS = {
  models: Cpu,
  search: Globe,
  flow: ListChecks,
  mcp: PuzzlePiece,
};

const OVERRIDE_NOTE = [
  { key: "1", text: "默认值定义在 configuration.py 的字段级 default" },
  { key: "2", text: "环境变量（全大写字段名）优先于默认值" },
  { key: "3", text: "运行时 config.configurable 覆盖环境变量，控制台直连模式即通过此通道传参" },
  { key: "4", text: "每个字段携带 x_oap_ui_config 元数据，驱动 OAP 平台的 UI 表单" },
];

export default function ConfigurationView() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6">
      <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">配置面</h1>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-mut">
        与后端 configuration.py 一一对应的完整配置面：四阶段独立模型、可切换搜索后端、
        并发与迭代上限，以及 MCP 外部工具接入。控制台的「运行配置」即此面的精简交互版。
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {CONFIG_GROUPS.map((g, gi) => {
          const Icon = GROUP_ICONS[g.key];
          return (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: gi * 0.06 }}
              className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon size={18} weight="bold" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold">{g.title}</h2>
                  <p className="text-[12px] text-faint">{g.desc}</p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-line">
                {g.items.map((it, i) => (
                  <div
                    key={it.field}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{it.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-faint">{it.field}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-mut">{it.note}</p>
                    </div>
                    <code className="shrink-0 rounded-md border border-line bg-bg px-2 py-1 font-mono text-[11.5px] text-accent">
                      {it.value}
                    </code>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* override priority */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45 }}
        className="mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6"
      >
        <h2 className="text-[16px] font-semibold">配置解析优先级</h2>
        <p className="mt-1 text-[13px] text-mut">
          Configuration.from_runnable_config 的解析顺序：
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {OVERRIDE_NOTE.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[11.5px] font-semibold text-accent">
                {s.key}
              </span>
              <p className="text-[12.5px] leading-relaxed text-mut">{s.text}</p>
              {i < OVERRIDE_NOTE.length - 1 && (
                <span className="hidden text-faint sm:block">→</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
