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

/** Derive a few plausible sub-topics from the user's topic. */
function deriveSubTopics(topic) {
  const t = topic.trim().replace(/[。！？.!?]+$/, "");
  return [
    `${t}：行业现状与市场规模`,
    `${t}：头部参与者与竞争格局`,
    `${t}：关键技术趋势与挑战`,
  ];
}

/** Derive search queries for a worker. */
function deriveQueries(sub, topic) {
  const q = (s) => s.trim();
  return [
    q(`${sub} 最新报告 2026`),
    q(`${sub} 市场规模 增长率`),
    q(`${sub} 头部玩家 案例`),
  ].filter(Boolean);
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Build a realistic-looking but clearly-labeled demo markdown report. */
function buildDemoReport(topic, topics, stats) {
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
    `- 示例来源 A：https://example.com/${encodeURIComponent(t1.slice(0, 18))}`,
    `- 示例来源 B：https://example.com/${encodeURIComponent(t2.slice(0, 18))}`,
    `- 示例来源 C：https://example.com/${encodeURIComponent(t3.slice(0, 18))}`,
    ``,
  ].join("\n");
}

/**
 * Run a simulated research session.
 * @param {string} topic
 * @param {object} cfg   run configuration
 * @param {(ev: object) => void} emit
 * @param {{ signal?: AbortSignal }} opts
 */
export async function runDemo(topic, cfg, emit, opts = {}) {
  const { signal } = opts;
  const tick = async (ms) => {
    if (signal && signal.aborted) throw new DOMException("aborted", "AbortError");
    await sleep(ms);
  };

  const topics = deriveSubTopics(topic);
  const maxUnits = clamp(cfg.max_concurrent_research_units || 5, 1, 8);
  const workers = topics.slice(0, Math.min(topics.length, maxUnits));
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
    const brief = `聚焦「${topic.trim()}」：梳理市场现状与规模，识别头部参与者与竞争格局，分析关键技术趋势与主要风险，最终输出一份结构化的综合研究报告。`;
    emit({ t: "brief", text: brief });
    emit({ t: "log", at: nowStamp(), actor: "write_research_brief", tag: "research_brief", msg: "已生成研究简报" });
    emit({ t: "stage", id: "brief", status: "done" });

    /* ---- supervisor ---- */
    emit({ t: "stage", id: "supervisor", status: "running" });
    await tick(700);
    log("research_supervisor", "think_tool", "问题可拆解为若干独立子任务，按主题维度分发可并行执行");
    stats.toolCalls += 1;
    await tick(500);
    workers.forEach((w, i) => {
      log("research_supervisor", "ConductResearch", `下发子任务 R${i + 1}：${w}`);
      stats.toolCalls += 1;
    });
    stats.iterations = 1;
    emit({ t: "stats", stats: { ...stats } });
    await tick(400);

    /* ---- parallel researchers ---- */
    emit({ t: "stage", id: "researcher", status: "running" });
    const results = await Promise.all(
      workers.map(async (sub, i) => {
        const wid = i + 1;
        emit({ t: "worker", wid, kind: "start", payload: { topic: sub } });
        const queries = deriveQueries(sub, topic);
        const notes = [];
        for (const q of queries) {
          await tick(700 + Math.random() * 500);
          const snippet = `命中 ${3 + (i * 2) % 5} 个来源，其中官方口径与行业榜单存在差异，需交叉验证`;
          emit({ t: "worker", wid, kind: "search", payload: { query: q, snippet } });
          stats.searches += 1;
          stats.toolCalls += 1;
          notes.push(q);
          emit({ t: "stats", stats: { ...stats } });
          await tick(250);
        }
        const reflection =
          i % 2 === 0
            ? "已有信息覆盖基本面，但缺少最新动态，补充一轮时效性检索后即可收尾"
            : "信息口径存在分歧，优先采信官方披露与一手数据，其余标记为待验证";
        emit({ t: "worker", wid, kind: "think", payload: { reflection } });
        await tick(450);
        const summary = `已完成「${sub}」的研究：共执行 ${queries.length} 轮检索，形成 ${queries.length + 1} 条要点，含现状、参与者与趋势。`;
        emit({ t: "worker", wid, kind: "done", payload: { summary } });
        return { sub, notes, summary };
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
      msg: `已压缩 ${results.length} 份研究员笔记，保留关键结论与来源`,
    });
    stats.toolCalls += results.length;
    emit({ t: "stats", stats: { ...stats } });
    await tick(300);
    emit({ t: "stage", id: "compress", status: "done" });

    /* ---- final report ---- */
    emit({ t: "stage", id: "report", status: "running" });
    const report = buildDemoReport(topic, topics, stats);
    const chunkSize = Math.max(24, Math.floor(report.length / 90));
    let i = 0;
    while (i < report.length) {
      await tick(26);
      const chunk = report.slice(i, i + chunkSize);
      i += chunkSize;
      emit({ t: "report", chunk });
    }
    emit({ t: "report_done", text: report });
    emit({ t: "log", at: nowStamp(), actor: "final_report_generation", tag: "完成", msg: "最终报告已生成" });
    await tick(300);
    emit({ t: "stage", id: "report", status: "done" });
    emit({ t: "done" });
  } catch (e) {
    if (e && e.name === "AbortError") return;
    emit({ t: "error", message: e?.message || "演示运行失败" });
  }
}
