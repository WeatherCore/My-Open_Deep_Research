import { useState } from "react";

/**
 * Interactive SVG diagram of the LangGraph state machine.
 * Layout: main flow on the top row, the supervisor/researcher subgraphs below.
 */

const NODES = [
  { id: "start", kind: "terminal", x: 40, y: 47, label: "START" },
  { id: "clarify", kind: "node", x: 100, y: 37, w: 150, h: 46, label: "澄清需求", en: "clarify_with_user", desc: "分析用户消息，判断研究范围是否清晰。范围不清时向用户提问并结束（allow_clarification）。" },
  { id: "brief", kind: "node", x: 290, y: 37, w: 170, h: 46, label: "撰写研究简报", en: "write_research_brief", desc: "调用研究模型，将用户消息结构化为一句话研究简报，并初始化主管上下文。" },
  { id: "report", kind: "node", x: 740, y: 37, w: 170, h: 46, label: "生成最终报告", en: "final_report_generation", desc: "综合全部研究笔记，用最终报告模型撰写结构化报告，超长时逐次截断重试。" },
  { id: "end", kind: "terminal", x: 975, y: 47, label: "END" },

  { id: "supervisor_group", kind: "group", x: 180, y: 230, w: 640, h: 380, label: "research_supervisor 子图", desc: "主管子图：规划策略、分发任务、汇总结果，直到研究完成。" },
  { id: "supervisor", kind: "node", x: 220, y: 292, w: 150, h: 46, label: "主管研究员", en: "supervisor", desc: "读取研究简报与工具结果，决定反思、分发子任务或宣布完成。" },
  { id: "supervisor_tools", kind: "node", x: 220, y: 452, w: 150, h: 46, label: "工具执行", en: "supervisor_tools", desc: "并行执行 think_tool 与 ConductResearch，把压缩后的研究结果回传给主管。" },

  { id: "researcher_group", kind: "group", x: 450, y: 270, w: 330, h: 310, label: "researcher 子图 ×N 并行", desc: "研究员子图：每个子任务一个独立研究员，由主管并行下发（默认最多 5 个）。" },
  { id: "researcher", kind: "node", x: 480, y: 330, w: 130, h: 40, label: "研究员", en: "researcher", desc: "围绕子任务调用搜索与 MCP 工具收集信息，每轮搜索后反思。" },
  { id: "researcher_tools", kind: "node", x: 480, y: 420, w: 130, h: 40, label: "工具执行", en: "researcher_tools", desc: "并行执行 web_search、MCP 工具、think_tool 与 ResearchComplete。" },
  { id: "compress", kind: "node", x: 480, y: 500, w: 130, h: 40, label: "压缩发现", en: "compress_research", desc: "把研究员的全部笔记压缩为结构化摘要，作为笔记回传主管。" },
];

const EDGES = [
  { id: "e1", from: "start", to: "clarify", d: "M 54 60 L 96 60", main: true },
  { id: "e2", from: "clarify", to: "brief", d: "M 252 60 L 286 60", main: true },
  {
    id: "e3",
    from: "brief",
    to: "supervisor",
    d: "M 375 83 C 375 170, 295 170, 295 288",
    main: true,
    label: "research_brief",
    lx: 384,
    ly: 158,
  },
  {
    id: "e4",
    from: "supervisor",
    to: "report",
    d: "M 812 300 C 900 300, 890 130, 828 87",
    main: true,
    label: "notes → 最终报告",
    lx: 848,
    ly: 196,
  },
  { id: "e5", from: "report", to: "end", d: "M 912 60 L 956 60", main: true },
  {
    id: "e6",
    from: "supervisor",
    to: "supervisor_tools",
    d: "M 295 338 L 295 448",
    label: "工具调用",
    lx: 300,
    ly: 390,
  },
  {
    id: "e7",
    from: "supervisor_tools",
    to: "supervisor",
    d: "M 326 452 L 326 342",
    label: "ToolMessage",
    lx: 333,
    ly: 394,
  },
  {
    id: "e8",
    from: "supervisor",
    to: "researcher",
    d: "M 372 312 C 415 312, 415 350, 476 350",
    label: "ConductResearch ×N",
    lx: 382,
    ly: 296,
  },
  {
    id: "e9",
    from: "researcher",
    to: "researcher_tools",
    d: "M 545 370 L 545 416",
    label: "工具调用",
    lx: 552,
    ly: 390,
  },
  {
    id: "e10",
    from: "researcher_tools",
    to: "researcher",
    d: "M 573 420 L 573 374",
    label: "ToolMessage",
    lx: 580,
    ly: 394,
  },
  {
    id: "e11",
    from: "researcher_tools",
    to: "compress",
    d: "M 545 460 L 545 496",
    label: "完成信号",
    lx: 552,
    ly: 476,
  },
  {
    id: "e12",
    from: "compress",
    to: "supervisor_tools",
    d: "M 476 520 C 425 520, 415 476, 372 476",
    label: "ToolMessage",
    lx: 400,
    ly: 512,
  },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

function edgeTouches(edge, id) {
  return edge.from === id || edge.to === id;
}

export default function GraphDiagram({ compact = false }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const dim = (id) => {
    if (!hovered) return false;
    const n = NODE_BY_ID[id];
    if (n.kind === "group") return false; // never dim container groups
    return !EDGES.some((e) => edgeTouches(e, id));
  };

  const detail = selected ? NODE_BY_ID[selected] : null;

  const renderNode = (n) => {
    if (n.kind === "terminal") {
      const cx = n.x, cy = n.y;
      return (
        <g
          key={n.id}
          style={{ opacity: dim(n.id) ? 0.22 : 1, transition: "opacity .25s" }}
          onMouseEnter={() => setHovered(n.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setSelected(n.id)}
          className="cursor-pointer"
        >
          <circle cx={cx} cy={cy} r="13" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="5" fill="var(--accent)" />
          <text x={n.id === "start" ? cx + 22 : cx - 22} y={cy + 4} textAnchor={n.id === "start" ? "start" : "end"} fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--mut)">
            {n.label}
          </text>
        </g>
      );
    }
    if (n.kind === "group") {
      return (
        <g
          key={n.id}
          style={{ opacity: dim(n.id) ? 0.22 : 1, transition: "opacity .25s" }}
        >
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            rx="16"
            fill="color-mix(in srgb, var(--surface) 62%, transparent)"
            stroke="var(--accent)"
            strokeOpacity="0.5"
            strokeWidth="1.3"
            strokeDasharray="6 6"
          />
          <text
            x={n.x + 18}
            y={n.y + 26}
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill="var(--accent)"
          >
            {n.label}
          </text>
        </g>
      );
    }
    const textY = n.en ? n.y + n.h / 2 - 4 : n.y + n.h / 2 + 4;
    const enY = n.en ? n.y + n.h / 2 + 13 : null;
    return (
      <g
        key={n.id}
        style={{ opacity: dim(n.id) ? 0.22 : 1, transition: "opacity .25s" }}
        onMouseEnter={() => setHovered(n.id)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => setSelected(n.id)}
        className="cursor-pointer"
      >
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx="10"
          fill={selected === n.id ? "var(--accent-soft)" : "var(--surface)"}
          stroke={hovered === n.id || selected === n.id ? "var(--accent)" : "var(--line)"}
          strokeWidth={hovered === n.id || selected === n.id ? 1.6 : 1.2}
          transition="all .2s"
        />
        <text x={n.x + n.w / 2} y={textY} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">
          {n.label}
        </text>
        {enY && (
          <text x={n.x + n.w / 2} y={enY} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--faint)">
            {n.en}
          </text>
        )}
      </g>
    );
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 1000 640"
          className="h-auto w-full min-w-[720px] select-none"
          role="img"
          aria-label="Open Deep Research 的 LangGraph 状态机架构图"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
            </marker>
          </defs>

          {EDGES.map((e) => {
            return (
              <g key={e.id}>
                <path
                  d={e.d}
                  fill="none"
                  stroke="var(--line2)"
                  strokeWidth="1.5"
                  strokeDasharray={e.main ? "none" : "none"}
                  markerEnd="url(#arrow)"
                  style={{ opacity: hovered && !edgeTouches(e, hovered) ? 0.25 : 1, transition: "opacity .25s" }}
                />
                {e.main && (
                  <path
                    d={e.d}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeOpacity="0.45"
                    className="edge-flow"
                    markerEnd="url(#arrow)"
                  />
                )}
                {e.label && (
                  <text
                    x={e.lx}
                    y={e.ly}
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fill="var(--faint)"
                    style={{ userSelect: "none" }}
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {NODES.map(renderNode)}

          {/* tool chips inside researcher group */}
          <text x="470" y="565" fontSize="10" fontFamily="var(--font-mono)" fill="var(--faint)">
            tools: web_search · think_tool · MCP · ResearchComplete
          </text>
          <text x="200" y="600" fontSize="10" fontFamily="var(--font-mono)" fill="var(--faint)">
            分支：范围不清时 clarify_with_user 向用户提问并结束
          </text>
        </svg>
      </div>

      {/* caption bar */}
      <div className="mt-3 flex min-h-[52px] items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        {detail ? (
          <>
            <span className="mt-0.5 font-mono text-[12px] font-semibold text-accent">
              {detail.label}
            </span>
            <p className="text-[13px] leading-relaxed text-mut">{detail.desc}</p>
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-mut">
            悬停查看节点关联，点击节点查看说明。主流程自上而下：澄清 → 简报 → 主管调度 → 并行研究 → 压缩 → 最终报告。
          </p>
        )}
      </div>
    </div>
  );
}
