import { motion } from "motion/react";
import { ArrowUpRight, Trophy, WarningCircle } from "@phosphor-icons/react";
import { BENCHMARKS } from "../lib/constants.js";

const STATS = [
  { label: "Deep Research Bench 排名", value: "第 6 名", note: "总分 0.4344（2025-08-02）" },
  { label: "最佳 RACE 分数", value: "0.4943", note: "GPT-5 配置" },
  { label: "最低成本", value: "$45.98", note: "默认配置 · 5800 万 tokens" },
  { label: "基准任务数", value: "100", note: "博士级 · 50 英 / 50 中" },
];

const STEPS = [
  {
    no: "01",
    title: "运行综合评估",
    cmd: "python tests/run_evaluate.py",
    desc: "在 LangSmith 数据集上跑全部 100 个博士级任务，生成实验链接。",
  },
  {
    no: "02",
    title: "提取结果",
    cmd: "python tests/extract_langsmith_data.py",
    desc: "将实验结果提取为可提交的 JSONL 文件（tests/expt_results/）。",
  },
  {
    no: "03",
    title: "提交榜单",
    cmd: "提交 deep_research_bench",
    desc: "按 Deep Research Bench 仓库的快速入门指南提交评分。",
  },
];

export default function BenchmarksView() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6">
      <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">评估基准</h1>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-mut">
        项目配置了 Deep Research Bench 评估：100 个由 22 个领域专家手工编写的博士级研究任务，
        以 RACE 分数衡量报告质量。以下为 README 中公开的实测结果。
      </p>

      {/* stat tiles */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
          >
            <p className="font-mono text-[24px] font-semibold leading-none text-tx sm:text-[28px]">
              {s.value}
            </p>
            <p className="mt-2 text-[12.5px] font-medium text-mut">{s.label}</p>
            <p className="mt-0.5 text-[11px] text-faint">{s.note}</p>
          </motion.div>
        ))}
      </div>

      {/* results table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45 }}
        className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface"
      >
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-line bg-surface2 text-[12px] text-mut">
              <th className="px-5 py-3 font-semibold">配置</th>
              <th className="px-4 py-3 font-semibold">摘要模型</th>
              <th className="px-4 py-3 font-semibold">研究模型</th>
              <th className="px-4 py-3 font-semibold">总成本</th>
              <th className="px-4 py-3 font-semibold">总 Token</th>
              <th className="px-4 py-3 font-semibold">RACE</th>
              <th className="px-4 py-3 font-semibold">排名</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b) => (
              <tr key={b.name} className="border-b border-line last:border-0 hover:bg-surface2/50">
                <td className="px-5 py-3.5">
                  <span className="text-[13.5px] font-semibold">{b.name}</span>
                  {b.rank === 1 && (
                    <Trophy size={13} weight="fill" className="ml-1.5 inline -translate-y-px text-warn" />
                  )}
                </td>
                <td className="px-4 py-3.5 font-mono text-[12px] text-mut">{b.summarization}</td>
                <td className="px-4 py-3.5 font-mono text-[12px] text-mut">{b.research}</td>
                <td className="px-4 py-3.5 font-mono text-[12.5px] text-tx">{b.cost ?? "暂无"}</td>
                <td className="px-4 py-3.5 font-mono text-[12.5px] text-mut">{b.tokens}</td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-[15px] font-semibold text-accent">
                    {b.race.toFixed(4)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-[12px] text-mut">#{b.rank}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* eval pipeline */}
      <div className="mt-8 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
        >
          <h2 className="text-[16px] font-semibold">评估流程</h2>
          <div className="mt-5 space-y-0">
            {STEPS.map((s, i) => (
              <div key={s.no} className="relative flex gap-4 pb-6 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-[15px] top-[34px] h-[calc(100%-24px)] w-px bg-line" />
                )}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft font-mono text-[11px] font-semibold text-accent">
                  {s.no}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">{s.title}</p>
                  <code className="mt-1 inline-block rounded-md border border-line bg-bg px-2 py-1 font-mono text-[11.5px] text-accent">
                    {s.cmd}
                  </code>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-warn/40 bg-warn/10 p-5 sm:p-6"
          >
            <span className="flex items-center gap-2 text-[14px] font-semibold text-warn">
              <WarningCircle size={16} weight="fill" />
              成本提示
            </span>
            <p className="mt-2 text-[13px] leading-relaxed text-mut">
              运行全部 100 个示例大约需要 $20-$100，具体取决于模型选择。
              建议先用少量任务验证配置，再跑全量评估。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
          >
            <h2 className="text-[16px] font-semibold">评分机制</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-mut">
              使用 Gemini 作为评审模型，对照领域专家编写的黄金标准报告评分。
              榜单基于 RACE 分数（Recall + Accuracy + Coverage + Evidence），
              覆盖 22 个领域，如科技、商业与金融。
            </p>
            <a
              href="https://huggingface.co/spaces/Ayanami0730/DeepResearch-Leaderboard"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-on transition-all hover:brightness-105"
            >
              查看排行榜
              <ArrowUpRight size={14} weight="bold" />
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
