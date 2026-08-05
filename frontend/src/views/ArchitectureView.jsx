import { motion } from "motion/react";
import {
  ArrowsClockwise,
  GitBranch,
  Globe,
  PuzzlePiece,
  Brain,
  ListChecks,
} from "@phosphor-icons/react";
import GraphDiagram from "../components/GraphDiagram.jsx";
import { TOOLS } from "../lib/constants.js";

const SUBGRAPHS = [
  {
    icon: GitBranch,
    title: "主图",
    en: "deep_researcher",
    nodes: ["clarify_with_user", "write_research_brief", "research_supervisor", "final_report_generation"],
    desc: "四个节点串成主流程，输入为 messages，输出为 final_report。",
  },
  {
    icon: ArrowsClockwise,
    title: "主管子图",
    en: "research_supervisor",
    nodes: ["supervisor ⇄ supervisor_tools"],
    desc: "主管循环调用 think_tool 反思、ConductResearch 分发任务，直至 ResearchComplete 或达到迭代上限。",
  },
  {
    icon: ListChecks,
    title: "研究员子图",
    en: "researcher_subgraph",
    nodes: ["researcher ⇄ researcher_tools → compress_research"],
    desc: "每个子任务一个研究员实例，并行执行搜索、MCP 工具与反思，最后压缩为结构化摘要。",
  },
];

const STATE_CARDS = [
  {
    title: "AgentState",
    fields: [
      ["messages", "对话消息流"],
      ["supervisor_messages", "主管上下文"],
      ["research_brief", "研究简报"],
      ["raw_notes", "原始研究笔记"],
      ["notes", "压缩后笔记"],
      ["final_report", "最终报告"],
    ],
  },
  {
    title: "SupervisorState",
    fields: [
      ["supervisor_messages", "主管消息"],
      ["research_brief", "研究简报"],
      ["research_iterations", "迭代计数"],
      ["notes / raw_notes", "笔记"],
    ],
  },
  {
    title: "ResearcherState",
    fields: [
      ["researcher_messages", "研究员消息"],
      ["research_topic", "子任务主题"],
      ["tool_call_iterations", "工具轮次"],
      ["compressed_research", "压缩摘要"],
    ],
  },
];

const STRUCTURED_OUTPUTS = [
  { name: "ClarifyWithUser", desc: "need_clarification · question · verification", note: "澄清阶段：是否需要提问，以及提问内容" },
  { name: "ResearchQuestion", desc: "research_brief", note: "简报阶段：结构化研究简报" },
  { name: "ConductResearch", desc: "research_topic", note: "主管下发子任务（需高细节描述）" },
  { name: "ResearchComplete", desc: "无参数", note: "声明研究完成" },
  { name: "Summary", desc: "summary · key_excerpts", note: "网页内容摘要与关键摘录" },
];

const TOOL_ICONS = {
  think_tool: Brain,
  ConductResearch: GitBranch,
  ResearchComplete: ListChecks,
  web_search: Globe,
  "MCP tools": PuzzlePiece,
};

export default function ArchitectureView() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6">
      <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">系统架构</h1>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-mut">
        一个由 LangGraph 状态机构成的多智能体系统：主图串联澄清、简报、调度与报告四个阶段，
        主管子图负责任务分解，研究员子图以并行实例执行搜索与反思。所有流程与数据由 Pydantic
        状态与结构化输出驱动。
      </p>

      {/* diagram */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-6"
      >
        <GraphDiagram />
      </motion.div>

      {/* subgraphs */}
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {SUBGRAPHS.map((g, i) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <g.icon size={18} weight="bold" />
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-[15px] font-semibold">{g.title}</h3>
              <span className="font-mono text-[11px] text-faint">{g.en}</span>
            </div>
            <p className="mt-1 font-mono text-[12px] text-accent">{g.nodes.join(" · ")}</p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-mut">{g.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* state + structured outputs */}
      <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold">Agent 状态</h2>
          <p className="mt-1 text-[13px] text-mut">
            状态通过 reducer 组合，支持追加与覆盖两种更新语义。
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {STATE_CARDS.map((s) => (
              <div key={s.title} className="rounded-xl border border-line bg-bg p-3.5">
                <p className="font-mono text-[12px] font-semibold text-accent">{s.title}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {s.fields.map(([k, v]) => (
                    <li key={k} className="text-[12px] leading-snug">
                      <span className="font-mono text-tx">{k}</span>
                      <span className="text-faint"> · {v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold">结构化输出</h2>
          <p className="mt-1 text-[13px] text-mut">
            关键阶段使用 Pydantic 模型约束输出，配合重试机制保证格式稳定。
          </p>
          <div className="mt-5 space-y-2.5">
            {STRUCTURED_OUTPUTS.map((s) => (
              <div key={s.name} className="flex items-start gap-3 rounded-xl border border-line bg-bg px-3.5 py-3">
                <span className="mt-0.5 font-mono text-[12.5px] font-semibold text-accent">
                  {s.name}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-mut">{s.desc}</p>
                  <p className="mt-0.5 text-[12px] text-faint">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tools */}
      <div className="mt-14">
        <h2 className="text-[17px] font-semibold">工具链</h2>
        <p className="mt-1 max-w-[60ch] text-[13px] text-mut">
          研究员与主管共享一套可插拔工具：反思、分发、完成信号三类核心工具，加上可切换的搜索后端与 MCP 外部工具。
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => {
            const Icon = TOOL_ICONS[t.name];
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface2 border border-line text-mut">
                  <Icon size={17} weight="bold" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[13px] font-semibold">{t.name}</span>
                    <span className="text-[12px] text-faint">{t.cn}</span>
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-mut">{t.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
