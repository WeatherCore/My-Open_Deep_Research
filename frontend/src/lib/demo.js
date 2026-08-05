/**
 * Demo run simulator. Emits the same unified event contract as the live
 * LangGraph normalizer (see api.js), so the console UI is agnostic to the
 * source. All numbers here are clearly synthetic demonstration data.
 *
 * Event contract:
 *   { t: "stage", id, status }                     stage transitions
 *   { t: "log", at, actor, tag, msg }              generic log line
 *   { t: "worker", wid, kind, payload }            worker events
 *   { t: "brief", text } | { t: "question", text }
 *   { t: "report", chunk } | { t: "report_done", text }
 *   { t: "stats", stats } | { t: "error", message } | { t: "done" }
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ============================================================
 * 四个内置示例的合成演示数据
 * 全部内容仅为模拟用途，文本中已多处标注「DEMO / 演示」字样。
 * 字段：
 *   brief            研究简报（写入 t:"brief"）
 *   executiveSummary 执行摘要（写入最终报告）
 *   researchers[3]   每位研究员的 topic / 3 个搜索 query / snippet / reflection / summary
 *   table[4]         「关键信息汇总」表格的 4 行
 *   actions[3-4]     结论与建议列表
 *   sources[3-4]     参考来源（示例链接）
 * ============================================================ */
const DEMO_CASES = {
  "2026 年 AI 推理市场的竞争格局分析": {
    brief:
      "聚焦「2026 年 AI 推理市场的竞争格局分析」：梳理推理服务市场结构与规模，识别头部与长尾参与者，分析价格/性能/商业模式的差异化路径，最终给出市场格局判断与买方选型建议。",
    executiveSummary:
      "2026 年是 AI 服务市场从「训练驱动」转向「推理驱动」的拐点：企业级推理算力支出首次超过训练支出，整体市场达 ~$280B；供给侧形成「硬件 + 专用芯片 + 模型聚合 + 云原生 + 开源」五类玩家并存的格局，Top 3 API 服务商合计占约 65% 收入份额；价格端 1M token 推理成本三年下降 >95%，竞争已从「单价」转向「单位经济性 + SLA + 可观测性」三维博弈。",
    researchers: [
      {
        topic: "AI 推理市场结构与规模",
        queries: ["2026 AI inference market size", "推理算力支出首次超过训练", "企业级推理 token 用量同比增长"],
        snippet:
          "多家机构均给出 2026 年企业级推理算力支出首次超过训练（约 54:46），整体市场达 ~$280B。",
        reflection:
          "基本盘数据已有交叉验证；下一步重点是价格走势与差异化路径。",
        summary:
          "2026 年 AI 推理服务市场进入「推理导向」拐点：需求侧企业级推理 token 用量同比增长 ~140%，供给侧形成「硬件 + 芯片 + 模型 + 云 + 开源」多层级格局；Top 3 API 服务商合计约占 65%。",
      },
      {
        topic: "头部参与者与商业模式",
        queries: ["NVIDIA inference GPU 份额", "Groq Cerebras 推理芯片", "DeepSeek Qwen 推理 API 价格"],
        snippet:
          "硬件（NVIDIA、AMD）、专用推理芯片（Groq、Cerebras）、模型聚合（Together、Fireworks）、云原生（AWS Bedrock、Azure AI）、开源权重 + 自营 API（DeepSeek、Qwen、Llama 套件）六大类型并存。",
        reflection:
          "玩家类型齐全；建议从 SLA 与单位经济性而非品牌做选型。",
        summary:
          "竞争格局分为五类玩家：① 通用 GPU（NVIDIA H 系列主导）；② 专用推理芯片（Groq LPU、Cerebras WSE）追求低延迟；③ 模型聚合平台（Together、Fireworks）做优化与多模型路由；④ 云厂原生推理（Bedrock、Azure AI）；⑤ 开源权重厂商自营 API（DeepSeek、Qwen、Llama 套件）。",
      },
      {
        topic: "价格走势、性能与差异化路径",
        queries: ["inference token price 2026", "p95 latency benchmark", "MoE 推理优化"],
        snippet:
          "1M token 推理价格从 2023 年的 $30-60 降到 2026 年的 $0.10-2；专用芯片 + MoE + 推测解码（speculative decoding）是三大工程优化方向。",
        reflection:
          "价格已逼近成本线，竞争从价格转向单位经济性、SLA 与可观测性。",
        summary:
          "价格走势：1M token 推理价格三年降幅 >95%，主流模型进入 $0.10-2 区间；性能维度从「吞吐量」转向「延迟（p95）/成本/可观测性」三维竞争；差异化路径包括 MoE 架构、推测解码、KV cache 复用与 SLA 分级定价。",
      },
    ],
    table: [
      ["市场拐点", "推理算力支出首次超过训练（约 54:46）", "NVIDIA / a16z 2026"],
      ["头部集中度", "Top 3 API 服务商约占 65% 收入份额", "a16z infra-2026"],
      ["价格区间", "$0.10 - $2 / 1M token（主流模型）", "公开定价快照"],
      ["延迟中位数", "200 - 800ms（长上下文场景）", "Artificial Analysis"],
    ],
    actions: [
      "按推理 SLA（p95 延迟）与单位经济性选型，而非单看 token 单价",
      "关键场景采用 2-3 家供应商 A/B 推理，避免锁定与单点故障",
      "数据敏感场景优先考虑开源权重 + 自有部署，可控性 + 长期成本更优",
      "建立「单位推理成本（$/1M token at p95 latency）」仪表板，每月复盘",
    ],
    sources: [
      "NVIDIA 2026 Q1 财报",
      "a16z 2026 infra 报告",
      "Artificial Analysis 推理基准",
      "DeepSeek 公开定价",
    ],
  },

  "开源大模型与闭源大模型的优劣势对比": {
    brief:
      "聚焦「开源大模型与闭源大模型的优劣势对比」：从基准性能、部署成本、合规与生态四个维度系统对比，给出 2026 年的差异化边界与按场景的选型建议。",
    executiveSummary:
      "2026 年中，头部开源模型（Llama-4、Qwen3、DeepSeek-V3）在公开基准上已追平闭源旗舰（GPT-5、Claude 4、Gemini 2.5），差距收窄到 <3%；成本端自托管在月调用量 >10B token 时才有显著 TCO 优势；合规与可定制化是开源自留地，不能用价格衡量。建议按「中小调用量用闭源 API，大调用量或敏感数据切自托管」双轨策略。",
    researchers: [
      {
        topic: "基准性能差距是否仍在",
        queries: ["open vs closed LLM benchmark 2026", "MMLU 开源模型排行", "HumanEval Llama Qwen"],
        snippet:
          "在多项公开基准（MMLU、HumanEval、MATH）上，开源头部模型（Llama-4、Qwen3、DeepSeek-V3）已追平闭源旗舰，差距收窄到 <3%。",
        reflection:
          "性能差距不再是关键决策因素；接下来重点看部署成本与合规。",
        summary:
          "截至 2026 年中，头部开源模型（Llama-4 405B、Qwen3-Max、DeepSeek-V3）在 MMLU、HumanEval、MATH 等公开基准上与闭源旗舰（GPT-5、Claude 4、Gemini 2.5）的差距已收窄到 <3%；闭源模型仅在长上下文、agent 与多模态原生融合上保持 5-10% 领先。",
      },
      {
        topic: "部署成本与运维复杂度",
        queries: ["self host Llama 405B cost", "inference TCO open source", "vLLM SGLang deployment"],
        snippet:
          "自托管 405B 级模型单卡成本约 $8-15/hr（A100/H100 月费），满负载下单位 token 成本可压到闭源 API 的 30-50%，但需要 MLOps 投入。",
        reflection:
          "成本优势明确，但有规模门槛；中小团队未必能拿到这 30-50% 的红利。",
        summary:
          "成本拆解：自托管头部开源模型，月度算力 + MLOps + 监控 ≈ $50K-150K，但满载时单位 token 成本可降至闭源 API 的 30-50%；当月调用量 <5B token 时，自托管 TCO 反而更贵（人力摊销）。阈值经验：稳定月调用 >10B token 的团队，自托管才显著省钱。",
      },
      {
        topic: "合规、生态与可定制性",
        queries: ["data privacy open source LLM", "model license Apache vs commercial", "fine-tuning vs prompt engineering"],
        snippet:
          "开源权重（Apache 2.0 / Llama Community License）在数据出境、审计、可微调上的灵活度明显高于闭源 API。",
        reflection:
          "合规与定制化是开源自留地；这是不能用价格衡量的优势。",
        summary:
          "合规：开源权重无数据出境问题，可全链路审计；闭源 API 受厂商政策与司法管辖限制。生态：vLLM、SGLang、TensorRT-LLM 等推理框架围绕开源权重形成活跃生态；闭源侧只有官方 SDK。定制化：开源支持全参数/LoRA 微调、SFT、偏好对齐；闭源仅支持 prompt 与有限的 fine-tuning 通道。",
      },
    ],
    table: [
      ["性能差距", "<3%（公开基准）/ 5-10%（长上下文/agent）", "公开基准 + 厂商评测"],
      ["自托管 TCO", "满载时单位 token ≈ 闭源 30-50%", "社区基准测算"],
      ["门槛调用量", "月 >10B token 时自托管显著省钱", "经验阈值"],
      ["合规灵活度", "开源显著优于闭源（数据/审计/微调）", "定性比较"],
    ],
    actions: [
      "中小调用量（<5B token/月）建议直接用闭源 API，专注业务",
      "月调用量 >10B token 或涉及敏感数据时，切换到自托管开源方案",
      "重要场景采用「闭源主力 + 开源兜底」双轨，避免厂商锁定",
      "自托管前评估 MLOps 能力：监控、扩缩容、KV cache、灰度发布缺一不可",
    ],
    sources: [
      "Open LLM Leaderboard",
      "Llama 4 官方仓库",
      "vLLM 项目",
      "DeepSeek-V3 技术报告",
    ],
  },

  "多智能体编排框架：LangGraph 与竞品对比": {
    brief:
      "聚焦「多智能体编排框架：LangGraph 与竞品对比」：对比 LangGraph、AutoGen、CrewAI、AWS Bedrock Agent 等主流编排框架，从状态管理、工具调用、可观测性、部署四个维度评估，给出按场景的选型建议。",
    executiveSummary:
      "LangGraph 以「显式图 + 状态归约器」表达复杂长流程，配合 LangSmith 提供可观测 + 部署 + Checkpointer 完整生产闭环；AutoGen 与 CrewAI 以多 agent 对话为抽象、上手最快，但生产化需要自行工程化。2026 年 MCP 已成为多智能体框架的事实标准，三家均已支持，工具生态不再是选型决定因素。选型主要看「流程复杂度 + 可观测需求 + 上手预算」。",
    researchers: [
      {
        topic: "状态管理与图执行模型",
        queries: ["LangGraph state graph", "AutoGen conversation patterns", "CrewAI role-based agents"],
        snippet:
          "LangGraph 用「显式图 + 状态归约器」表达流程；AutoGen/CrewAI 主要基于「多 agent 对话」，状态隐式。",
        reflection:
          "图模型表达力强但学习曲线陡；对话模型简单但难做复杂流程。",
        summary:
          "LangGraph：以 StateGraph 为核心，节点是有状态函数，边可条件路由，支持子图嵌套和 Command 模式动态跳转；表达力强，适合复杂长流程。AutoGen / CrewAI：以多 agent 对话为主要抽象，状态隐式在消息历史里，上手快，但难以表达复杂分支/重试/人在回路。",
      },
      {
        topic: "工具调用、MCP 与生态",
        queries: ["MCP support LangGraph", "tool calling agents 2026", "function calling multi agent"],
        snippet:
          "MCP（Model Context Protocol）已成事实标准，LangGraph、AutoGen、CrewAI 均已支持。",
        reflection:
          "MCP 兼容是底线；差异化在生态与调试工具。",
        summary:
          "MCP 兼容：LangGraph 通过 langchain-mcp-adapters 原生支持；AutoGen 2026 版内置 MCP 客户端；CrewAI 通过额外封装支持。生态：LangGraph 背靠 LangChain 体系（100+ 集成）；AutoGen 微软研究院背书，VS Code / Azure 集成深；CrewAI 独立项目，社区驱动增长快。",
      },
      {
        topic: "可观测性、部署与生产化",
        queries: ["LangGraph platform", "agent observability tracing", "agent deployment production"],
        snippet:
          "LangGraph Platform 提供 Studio、Studio-in-Cloud 与 LangSmith 完整可观测链路；AutoGen/CrewAI 主要靠第三方工具。",
        reflection:
          "生产化能力是 LangGraph 的护城河；其他框架仍在追赶。",
        summary:
          "可观测性：LangGraph + LangSmith 提供 trace、token 计费、prompt 版本化一站式体验；AutoGen/CrewAI 需自接 Langfuse / OpenTelemetry。部署：LangGraph Platform 支持一键部署 + Studio + Checkpointer；AutoGen / CrewAI 需自行工程化（容器化、状态持久化、人在回路）。门槛：LangGraph 学习曲线陡但工程闭环好；AutoGen/CrewAI 容易上手但生产化需自行补齐。",
      },
    ],
    table: [
      ["表达力", "LangGraph > AutoGen ≈ CrewAI", "复杂流程可控性"],
      ["上手难度", "CrewAI < AutoGen < LangGraph", "工程直觉"],
      ["MCP 兼容", "三框架均支持", "2026 事实标准"],
      ["生产闭环", "LangGraph 最佳（LangSmith）", "可观测 + 部署"],
    ],
    actions: [
      "复杂长流程 / 强可观测需求 → LangGraph（学习曲线值）",
      "快速验证 / 简单协作场景 → CrewAI（上手最快）",
      "微软 / Azure 技术栈且偏研究场景 → AutoGen",
      "所有框架都接 MCP，工具生态已不再是选型决定因素",
    ],
    sources: [
      "LangGraph 官方文档",
      "AutoGen GitHub 仓库",
      "CrewAI 官方站点",
      "LangSmith 可观测平台",
    ],
  },

  "量子计算行业最新投资机会盘点": {
    brief:
      "聚焦「量子计算行业最新投资机会盘点」：盘点 2026 年量子计算硬件路线（超导/离子阱/光量子/中性原子）的产业进展、头部公司融资节奏、应用场景与二级市场表现，给出按赛道与时间窗口的投资建议。",
    executiveSummary:
      "2026 年量子计算处于「硬件路线分叉 + 应用商业化起步」的中间阶段。硬件四条路线（超导 / 离子阱 / 光量子 / 中性原子）各占山头、量产时间表差异大；一级市场 2026 H1 融资 ~$2.1B（+25% YoY），单笔最大 PsiQuantum $940M；二级市场小盘股波动剧烈，散户风险显著高于机构。投资建议：硬件层「路线赌注」风险高，建议通过量子 ETF 或应用层基金分散；可关注「不押路线」中间层（全栈软件、量子-经典混合云、纠错中间件）以及确定性较高的后量子密码学（PQC）迁移方向。",
    researchers: [
      {
        topic: "硬件路线竞争格局",
        queries: ["quantum computing roadmap 2026", "superconducting vs trapped ion", "neutral atom quantum"],
        snippet:
          "四条主流硬件路线各占山头：超导（IBM、Google）、离子阱（IonQ、Quantinuum）、光量子（PsiQuantum、Xanadu）、中性原子（QuEra、Atom Computing）。",
        reflection:
          "硬件路线分散度高，投资「路线赌注」风险大；二级市场应关注应用层与全栈软件。",
        summary:
          "2026 年硬件路线格局：超导（IBM Heron、Google Willow）规模最大、生态最成熟；离子阱（IonQ Forte、Quantinuum H2）门保真度领先；光量子（PsiQuantum）与中性原子（QuEra、Atom Computing）扩比特数路线激进但量产时间表最不确定。建议关注「不押路线」的中间层（全栈软件、量子-经典混合云、纠错中间件）。",
      },
      {
        topic: "融资节奏与资本动态",
        queries: ["PsiQuantum funding 2026", "quantum startup Series B C 2026", "quantum VC investment"],
        snippet:
          "2026 上半年量子计算融资 ~$2.1B，PsiQuantum 单笔 $940M 居首，二级市场 Quantum Computing Inc. 等小盘股波动剧烈。",
        reflection:
          "一级市场单笔大、二级市场炒作多；散户风险显著高于机构。",
        summary:
          "一级市场：2026 H1 量子计算融资约 $2.1B，同比增长 ~25%；单笔最大为 PsiQuantum $940M（D 轮）。头部玩家进入「拼工程化」阶段，从实验室向晶圆厂迁移（PsiQuantum 在布里斯班建厂）。二级市场：Quantum Computing Inc.（QCI）、Rigetti 等小盘股年内波动 >80%，散户情绪驱动明显；机构参与有限。",
      },
      {
        topic: "应用场景与商业化时间表",
        queries: ["quantum advantage drug discovery", "quantum optimization finance", "post quantum cryptography 2026"],
        snippet:
          "药物分子模拟与材料设计是近期最可能产生「量子优势」的方向；金融组合优化与密码学（后量子）是中期方向。",
        reflection:
          "应用商业化 5-10 年时间表清晰；早期投资需做好长期持有准备。",
        summary:
          "近 3-5 年可落地：分子模拟（与制药企业合作）、量子-经典混合优化（物流、金融组合）。5-10 年：通用容错量子计算（仍需重大工程突破）、后量子密码学（PQC 标准已落地 NIST，迁移期到 2030+）。投资建议：硬件公司早期估值过高，可关注「应用 + 软件」中早期（种子-A 轮），以及量子-云服务平台（AWS Braket、Azure Quantum）生态合作方。",
      },
    ],
    table: [
      ["硬件路线", "超导 / 离子阱 / 光量子 / 中性原子 四线并行", "IBM / Google / PsiQuantum / QuEra"],
      ["融资节奏", "2026 H1 ~$2.1B（+25% YoY）", "PitchBook"],
      ["商业化窗口", "应用层 3-5 年，通用容错 10+ 年", "行业共识"],
      ["二级市场", "小盘股波动剧烈，散户风险高", "QCI / Rigetti"],
    ],
    actions: [
      "硬件路线分散度高，建议通过量子 ETF 或应用层基金分散风险",
      "关注全栈软件、量子-经典混合云、纠错中间件等「不押路线」中间层",
      "散户参与二级市场需做好波动预案（>50% 回撤），控制仓位",
      "后量子密码学（PQC）迁移是确定性方向，可关注相关安全厂商",
    ],
    sources: [
      "PsiQuantum 2026 公告",
      "IBM Quantum Roadmap",
      "PitchBook 量子计算 2026 报告",
      "NIST PQC 标准",
    ],
  },
};

/* ============================================================
 * 匹配用户输入到内置案例
 * 1) 完全相等（含 trim）；2) 去掉空白与标点后互相包含
 * 都没有命中则返回 null，调用方走通用兜底
 * ============================================================ */
function findCase(topic) {
  const t = (topic || "").trim();
  if (!t) return null;
  if (DEMO_CASES[t]) return DEMO_CASES[t];
  const norm = (s) => s.replace(/[\s，。！？,.!?；;：:、]+/g, "").toLowerCase();
  const tn = norm(t);
  for (const key of Object.keys(DEMO_CASES)) {
    const kn = norm(key);
    if (tn.includes(kn) || kn.includes(tn)) return DEMO_CASES[key];
  }
  return null;
}

/* ============================================================
 * 通用兜底（用户输入非四个示例时的合成报告）
 * ============================================================ */
function deriveSubTopics(topic) {
  const t = topic.trim().replace(/[。！？.!?]+$/, "");
  return [
    `${t}：行业现状与市场规模`,
    `${t}：头部参与者与竞争格局`,
    `${t}：关键技术趋势与挑战`,
  ];
}

function deriveQueries(sub) {
  return [
    `${sub} 最新报告 2026`,
    `${sub} 市场规模 增长率`,
    `${sub} 头部玩家 案例`,
  ].filter(Boolean);
}

function buildGenericReport(topic, topics) {
  const [t1, t2, t3] = topics;
  const n = topics.length;
  return [
    `# ${topic.trim()}`,
    ``,
    `> 演示数据 DEMO：本报告由模拟运行自动生成，仅用于展示前端界面，不构成真实研究结论。`,
    ``,
    `## 执行摘要`,
    ``,
    `围绕「${topic.trim()}」，主管研究员将问题拆解为 ${n} 个并行研究子任务，由 ${n} 个研究员通过联网搜索、摘要提炼与反思交叉验证后完成。研究发现，该主题呈现信息密度高、来源分散、口径不一的特点，多源交叉验证能显著提升结论的可信度。`,
    ``,
    `## 研究范围与方法`,
    ``,
    `- 研究问题由用户提出，经结构化分析生成研究简报`,
    `- 主管按主题维度拆解子任务，每个子任务独立成组`,
    `- 研究员通过 web_search 检索，摘要模型对原文进行提炼`,
    `- 每轮搜索后调用 think_tool 进行反思，评估信息缺口`,
    `- 发现经压缩模型整理后汇总至最终报告`,
    ``,
    `## 核心发现`,
    ``,
    `### 1. ${t1.replace(/：.*$/, "")}`,
    ``,
    `从公开信息看，该方向处于活跃演进期：头部参与者的公开材料相对完整，但口径差异较大；新兴参与者增长数据分散在融资、产品发布与行业榜单中，需要逐条比对。行业报告普遍强调长期增长空间，短期波动主要由供需与政策节奏驱动。`,
    ``,
    `### 2. ${t2.replace(/：.*$/, "")}`,
    ``,
    `竞争格局呈现"少数主导、长尾活跃"的特征。主导者的优势集中在生态、数据与资本，长尾参与者则以垂直场景、差异化定价与技术路线创新切入。交叉验证显示，不同来源对份额的估算差异可达两位数，建议以官方披露与一手数据为准。`,
    ``,
    `### 3. ${t3.replace(/：.*$/, "")}`,
    ``,
    `关键技术趋势包括：工程化能力（推理成本、延迟）成为差异化核心；标准化与互操作性需求上升；监管与安全约束对落地节奏的影响在增强。综合来看，判断力比信息量更重要，建议关注可验证的一手指标。`,
    ``,
    `## 关键信息汇总`,
    ``,
    `| 维度 | 观察 | 来源形态 |`,
    `| --- | --- | --- |`,
    `| 信息丰富度 | 高 | 行业报告、新闻、官方文档 |`,
    `| 口径一致性 | 中 | 需要交叉验证 |`,
    `| 一手数据可得性 | 中 | 官网、财报、发布会 |`,
    `| 时效性敏感度 | 高 | 建议持续跟踪 |`,
    ``,
    `## 结论与建议`,
    ``,
    `1. 优先采信一手来源（官方披露、财报、产品实测），对二手转述保持警惕`,
    `2. 对关键数字建立多源比对表，标注口径与时间`,
    `3. 该主题变化快，建议设置定期复查机制`,
    `4. 如需深入，可对头部参与者逐一展开专项研究`,
    ``,
    `## 参考来源（示例）`,
    ``,
    `- 来源 A（演示数据）：${t1.replace(/：.*$/, "")}`,
    `- 来源 B（演示数据）：${t2.replace(/：.*$/, "")}`,
    `- 来源 C（演示数据）：${t3.replace(/：.*$/, "")}`,
    ``,
    `> 注：本节所有来源均为示意，未指向真实链接；真实研究请核实原文出处。`,
    ``,
  ].join("\n");
}

/* ============================================================
 * 案例专属报告（与通用兜底互斥；调用方按 findCase 结果二选一）
 * ============================================================ */
function buildCaseReport(topic, caseObj) {
  const r = caseObj.researchers;
  const lines = [
    `# ${topic.trim()}`,
    ``,
    `> 演示数据 DEMO：本报告为前端演示模式生成的合成数据，所有数字、公司动态、价格均为示意，仅用于展示前端界面，不构成真实研究结论。`,
    ``,
    `## 执行摘要`,
    ``,
    caseObj.executiveSummary,
    ``,
    `## 研究范围与方法`,
    ``,
    `- 研究问题由用户提出，经结构化分析生成研究简报`,
    `- 主管按主题维度拆解 ${r.length} 个子任务并行执行`,
    `- 研究员通过 web_search 检索，摘要模型对原文进行提炼`,
    `- 每轮搜索后调用 think_tool 反思，评估信息缺口`,
    `- 发现经压缩模型整理后汇总至最终报告`,
    ``,
    `## 核心发现`,
    ``,
  ];
  r.forEach((w, i) => {
    lines.push(`### ${i + 1}. ${w.topic}`, ``, w.summary, ``);
  });
  lines.push(
    `## 关键信息汇总`,
    ``,
    `| 维度 | 观察 | 来源形态 |`,
    `| --- | --- | --- |`,
  );
  caseObj.table.forEach((row) => {
    lines.push(`| ${row[0]} | ${row[1]} | ${row[2]} |`);
  });
  lines.push(``, `## 结论与建议`, ``);
  caseObj.actions.forEach((a, i) => {
    lines.push(`${i + 1}. ${a}`);
  });
  lines.push(``, `## 参考来源（示例）`, ``);
  caseObj.sources.forEach((s) => {
    lines.push(`- ${s}（演示数据，未提供真实链接）`);
  });
  lines.push(
    ``,
    `> 注：本节所有来源名称仅为示意，不指向真实链接；真实研究请核实原文出处。`,
  );
  lines.push(``);
  return lines.join("\n");
}

function buildDemoReport(topic, caseObj, topics) {
  return caseObj ? buildCaseReport(topic, caseObj) : buildGenericReport(topic, topics);
}

/* ============================================================
 * 运行模拟
 * ============================================================ */
export async function runDemo(topic, cfg, emit, opts = {}) {
  const { signal } = opts;
  const tick = async (ms) => {
    if (signal && signal.aborted) throw new DOMException("aborted", "AbortError");
    await sleep(ms);
  };

  const caseObj = findCase(topic);
  // 案例模式下用案例的子主题；否则通用兜底推导
  const subTopicLabels = caseObj
    ? caseObj.researchers.map((w) => w.topic)
    : deriveSubTopics(topic);
  const maxUnits = clamp(cfg.max_concurrent_research_units || 5, 1, 8);
  const workers = subTopicLabels.slice(0, Math.min(subTopicLabels.length, maxUnits));
  const stats = {
    iterations: 0,
    searches: 0,
    toolCalls: 0,
    workers: workers.length,
    brief: "",
  };

  const log = (actor, tag, msg) =>
    emit({ t: "log", at: nowStamp(), actor, tag, msg });

  try {
    /* ---- clarify ---- */
    emit({ t: "stage", id: "clarify", status: "running" });
    await tick(650);
    if (cfg.allow_clarification !== false) {
      log("clarify_with_user", "分析", "研究范围清晰，无需追问，直接进入研究简报阶段");
    }
    emit({ t: "stage", id: "clarify", status: "done" });

    /* ---- brief ---- */
    emit({ t: "stage", id: "brief", status: "running" });
    await tick(900);
    const brief = caseObj
      ? caseObj.brief
      : `聚焦「${topic.trim()}」：梳理市场现状与规模，识别头部参与者与竞争格局，分析关键技术趋势与主要风险，最终输出一份结构化的综合研究报告。`;
    emit({ t: "brief", text: brief });
    emit({
      t: "log",
      at: nowStamp(),
      actor: "write_research_brief",
      tag: "research_brief",
      msg: caseObj ? "已生成研究简报（内置示例）" : "已生成研究简报",
    });
    emit({ t: "stage", id: "brief", status: "done" });

    /* ---- supervisor ---- */
    emit({ t: "stage", id: "supervisor", status: "running" });
    await tick(700);
    log("research_supervisor", "think_tool", "问题可拆解为若干独立子任务，按主题维度分发可并行执行");
    stats.toolCalls += 1;
    await tick(500);
    workers.forEach((w, i) => {
      log(
        "research_supervisor",
        "ConductResearch",
        `下发子任务 R${i + 1}：${w}`,
      );
      stats.toolCalls += 1;
    });
    stats.iterations = 1;
    emit({ t: "stats", stats: { ...stats } });
    await tick(400);
    /* 主管完成调度，进入并行研究阶段 */
    emit({ t: "stage", id: "supervisor", status: "done" });

    /* ---- parallel researchers ---- */
    emit({ t: "stage", id: "researcher", status: "running" });
    const results = await Promise.all(
      workers.map(async (sub, i) => {
        const wid = i + 1;
        emit({ t: "worker", wid, kind: "start", payload: { topic: sub } });
        // 案例数据优先；没有则通用兜底
        const r = caseObj?.researchers?.[i];
        const queries = r?.queries || deriveQueries(sub);
        const snippet =
          r?.snippet ||
          `命中 ${3 + (i * 2) % 5} 个来源，其中官方口径与行业榜单存在差异，需交叉验证`;
        const reflection =
          r?.reflection ||
          (i % 2 === 0
            ? "已有信息覆盖基本面，但缺少最新动态，补充一轮时效性检索后即可收尾"
            : "信息口径存在分歧，优先采信官方披露与一手数据，其余标记为待验证");
        const summary =
          r?.summary ||
          `已完成「${sub}」的研究：共执行 ${queries.length} 轮检索，形成 ${queries.length + 1} 条要点，含现状、参与者与趋势。`;

        for (const q of queries) {
          await tick(700 + Math.random() * 500);
          emit({
            t: "worker",
            wid,
            kind: "search",
            payload: { query: q, snippet },
          });
          stats.searches += 1;
          stats.toolCalls += 1;
          emit({ t: "stats", stats: { ...stats } });
          await tick(250);
        }
        emit({
          t: "worker",
          wid,
          kind: "think",
          payload: { reflection },
        });
        await tick(450);
        emit({
          t: "worker",
          wid,
          kind: "done",
          payload: { summary },
        });
        return { sub, summary };
      })
    );

    /* ---- compress ---- */
    emit({ t: "stage", id: "researcher", status: "done" });
    emit({ t: "stage", id: "compress", status: "running" });
    await tick(900);
    emit({
      t: "log",
      at: nowStamp(),
      actor: "compress_research",
      tag: "压缩",
      msg: caseObj
        ? `已压缩 ${results.length} 份研究员笔记（示例案例），保留关键结论与来源`
        : `已压缩 ${results.length} 份研究员笔记，保留关键结论与来源`,
    });
    stats.toolCalls += results.length;
    emit({ t: "stats", stats: { ...stats } });
    await tick(300);
    emit({ t: "stage", id: "compress", status: "done" });

    /* ---- final report ---- */
    emit({ t: "stage", id: "report", status: "running" });
    const report = buildDemoReport(topic, caseObj, subTopicLabels);
    const chunkSize = Math.max(24, Math.floor(report.length / 90));
    let i = 0;
    while (i < report.length) {
      await tick(26);
      const chunk = report.slice(i, i + chunkSize);
      i += chunkSize;
      emit({ t: "report", chunk });
    }
    emit({ t: "report_done", text: report });
    emit({
      t: "log",
      at: nowStamp(),
      actor: "final_report_generation",
      tag: "完成",
      msg: caseObj ? "最终报告已生成（示例案例 DEMO）" : "最终报告已生成",
    });
    await tick(300);
    emit({ t: "stage", id: "report", status: "done" });
    emit({ t: "done" });
  } catch (e) {
    if (e && e.name === "AbortError") return;
    emit({ t: "error", message: e?.message || "演示运行失败" });
  }
}