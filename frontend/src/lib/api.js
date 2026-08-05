/**
 * LangGraph API client for the local dev server (default http://127.0.0.1:2024).
 *
 * The dev server (langgraph dev) exposes the LangGraph Platform REST API.
 * We consume two stream modes:
 *   - "updates"  -> per-node updates, drives stage transitions
 *   - "values"   -> full state snapshots (messages, research_brief, final_report)
 *   - "messages" -> token-level chunks, used to stream the final report
 *
 * Every incoming LangGraph event is normalized into the same unified event
 * contract used by the demo simulator (see demo.js), so the UI never knows
 * whether it is watching a live run or a simulation.
 */

import { STAGE_ORDER } from "./constants.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const NODE_TO_STAGE = {
  clarify_with_user: "clarify",
  write_research_brief: "brief",
  research_supervisor: "supervisor",
  final_report_generation: "report",
};

/** Probe the backend. Accepts both /info (platform API) and /assistants. */
export async function checkBackend(baseUrl) {
  const probe = async (path) => {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return false;
    }
  };
  if (await probe("/info")) return { ok: true, endpoint: "/info" };
  if (await probe("/assistants")) return { ok: true, endpoint: "/assistants" };
  return { ok: false };
}

/** List assistants and pick the Deep Researcher graph when present. */
export async function listAssistants(baseUrl) {
  // langgraph-api 0.10.x：助手的列表接口是 POST /assistants/search（GET /assistants 不存在）
  const res = await fetch(`${baseUrl}/assistants/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`POST /assistants/search 返回 ${res.status}`);
  const arr = await res.json();
  const picked =
    arr.find((a) =>
      /deep.?research/i.test(`${a.graph_id || ""} ${a.name || ""}`)
    ) || arr[0];
  return { assistants: arr, picked: picked || null };
}

/** Recursively find known subgraph node keys inside an updates payload. */
function subgraphKeys(payload, out = []) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return out;
  for (const [k, v] of Object.entries(payload)) {
    out.push(k);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const k2 of Object.keys(v)) {
        if (!["messages", "notes", "raw_notes", "final_report"].includes(k2)) {
          out.push(k2);
        }
      }
    }
  }
  return out;
}

/** Pull unseen tool calls out of a messages array. */
function extractToolCalls(messages, seen) {
  const out = [];
  for (const m of messages || []) {
    for (const tc of m.tool_calls || []) {
      if (seen.has(tc.id)) continue;
      seen.add(tc.id);
      out.push(tc);
    }
  }
  return out;
}

const fmt = (s) => String(s).slice(0, 220);

/**
 * Start a live run against the LangGraph server and normalize SSE events.
 * @param {object} p
 * @param {string} p.baseUrl
 * @param {string} p.assistantId
 * @param {object} p.input          e.g. { messages: [{role:"user", content}] }
 * @param {object} p.configurable   run config passed through config.configurable
 * @param {(ev: object) => void} p.emit
 * @param {{ signal?: AbortSignal, headers?: Record<string,string> }} p.opts
 */
export async function startLiveRun({ baseUrl, assistantId, input, configurable, emit, opts = {} }) {
  const { signal, headers = {} } = opts;

  let res;
  try {
    res = await fetch(`${baseUrl}/runs/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        assistant_id: assistantId,
        input,
        stream_mode: ["values", "updates", "messages"],
        config: { configurable },
      }),
      signal,
    });
  } catch (e) {
    if (e && e.name === "AbortError") return;
    throw new Error(
      "无法连接 LangGraph 后端。请确认已启动服务（见下方说明），或切换为演示模式。"
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`后端返回 ${res.status}：${fmt(text)}`);
  }

  /* ---- normalization state ---- */
  const seenToolCalls = new Set();
  const seenWorkerCalls = new Set();
  let nextWid = 0;
  const stageSeen = new Set();
  let lastStage = null;
  let questionEmitted = false;
  let reportEmitted = false;
  let briefEmitted = false;
  const stats = { iterations: 0, searches: 0, toolCalls: 0, workers: 0 };
  let supervisorLoops = 0;
  const nodeByRun = new Map(); // messages/metadata 的 run_key → langgraph_node

  const finishStage = (id, status = "done") => emit({ t: "stage", id, status });
  const startStage = (id) => {
    if (stageSeen.has(id)) return;
    stageSeen.add(id);
    if (lastStage && STAGE_ORDER.indexOf(id) > STAGE_ORDER.indexOf(lastStage)) {
      finishStage(lastStage);
    }
    emit({ t: "stage", id, status: "running" });
    lastStage = id;
  };

  const nowStamp = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  const emitToolLogs = (messages) => {
    const calls = extractToolCalls(messages, seenToolCalls);
    for (const tc of calls) {
      const name = tc.name || "tool";
      let argStr = "";
      const a = tc.args;
      if (typeof a === "string") {
        try {
          const parsed = JSON.parse(a);
          argStr = parsed.reflection || parsed.research_topic || "";
        } catch {
          argStr = a;
        }
      } else if (a && typeof a === "object") {
        argStr = a.reflection || a.research_topic || JSON.stringify(a);
      }
      argStr = fmt(argStr);

      stats.toolCalls += 1;
      if (name === "web_search" || name === "tavily_search") {
        stats.searches += 1;
        emit({
          t: "log",
          at: nowStamp(),
          actor: "researcher",
          tag: "web_search",
          msg: argStr ? `查询：${argStr}` : "发起搜索",
        });
      } else if (name === "ConductResearch") {
        stats.workers += 1;
        if (!seenWorkerCalls.has(tc.id)) {
          seenWorkerCalls.add(tc.id);
          nextWid += 1;
          emit({
            t: "worker",
            wid: nextWid,
            kind: "start",
            payload: { topic: argStr || "研究子任务" },
          });
        }
        emit({
          t: "log",
          at: nowStamp(),
          actor: "research_supervisor",
          tag: "ConductResearch",
          msg: argStr ? `下发子任务：${argStr}` : "下发子任务",
        });
      } else if (name === "think_tool") {
        emit({
          t: "log",
          at: nowStamp(),
          actor: lastStage === "researcher" ? "researcher" : "research_supervisor",
          tag: "think_tool",
          msg: argStr ? `反思：${argStr}` : "反思中",
        });
      } else if (name === "ResearchComplete") {
        emit({
          t: "log",
          at: nowStamp(),
          actor: "research_supervisor",
          tag: "ResearchComplete",
          msg: "研究完成信号",
        });
      } else {
        emit({
          t: "log",
          at: nowStamp(),
          actor: lastStage === "researcher" ? "researcher" : "research_supervisor",
          tag: name,
          msg: argStr,
        });
      }
      emit({ t: "stats", stats: { ...stats } });
    }
  };

  /* ---- SSE parsing ---- */
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let ended = false;

  const handleEvent = (event, data) => {
    if (event === "values") {
      const v = data || {};
      if (v.research_brief && !briefEmitted) {
        briefEmitted = true;
        emit({ t: "brief", text: v.research_brief });
      }
      emitToolLogs(v.messages);
      if (v.final_report && !reportEmitted) {
        reportEmitted = true;
        emit({ t: "report_done", text: v.final_report });
      }
      const msgs = v.messages || [];
      const last = msgs[msgs.length - 1];
      if (
        last &&
        (last.type === "ai" || last.role === "ai") &&
        last.name === "clarify_question" &&
        last.content &&
        !briefEmitted &&
        !questionEmitted
      ) {
        questionEmitted = true;
        emit({ t: "question", text: fmt(last.content) });
      }
    } else if (event === "updates") {
      for (const [node, payload] of Object.entries(data || {})) {
        if (node === "research_supervisor") {
          supervisorLoops += 1;
          stats.iterations = supervisorLoops;
          emit({ t: "stats", stats: { ...stats } });
        }
        if (NODE_TO_STAGE[node]) startStage(NODE_TO_STAGE[node]);
        // research_supervisor 是固定排在 brief 之后的节点，但它的更新要等整个
        // 研究阶段（主管/研究员/压缩）全部结束才发出。write_research_brief 一完成
        // 就提前点亮 supervisor，避免界面长时间停在"撰写研究简报"。
        if (node === "write_research_brief") startStage("supervisor");
        for (const key of subgraphKeys(payload)) {
          if (key === "researcher" || key === "researcher_tools") {
            startStage("researcher");
          } else if (key === "compress_research") {
            startStage("compress");
          } else if (key === "supervisor" || key === "supervisor_tools") {
            startStage("supervisor");
          }
        }
      }
    } else if (event === "messages/metadata") {
      // 每个 LLM 调用的元数据都带 langgraph_node。整个研究阶段（主管/研究员/压缩）
      // 都包在顶层 research_supervisor 节点里，顶层 updates 要等研究结束才发——
      // 所以用这里的实时信号推进阶段，否则界面会一直停在"撰写研究简报"。
      for (const [k, v] of Object.entries(data || {})) {
        const node = v?.metadata?.langgraph_node;
        if (node) {
          nodeByRun.set(k, node);
          if (NODE_TO_STAGE[node]) startStage(NODE_TO_STAGE[node]);
        }
      }
    } else if (event === "messages/partial" || event === "messages") {
      const msg = Array.isArray(data) ? data[0] : data;
      if (!msg || typeof msg !== "object") return;
      // 工具调用实时流出：用工具名点亮 researcher / supervisor 阶段
      for (const tc of msg.tool_calls || []) {
        if (tc.name === "web_search" || tc.name === "tavily_search") startStage("researcher");
        else if (tc.name === "ConductResearch") startStage("supervisor");
      }
      emitToolLogs([msg]);
      // 最终报告 token 级流式输出（report_done 仍会兜底整篇文本）
      if (msg.content && !Array.isArray(msg.content)) {
        const runKey = String(msg.id || "").replace(/^lc_run--/, "");
        if (nodeByRun.get(runKey) === "final_report_generation") {
          emit({ t: "report", chunk: msg.content });
        }
      }
    } else if (event === "end") {
      ended = true;
    } else if (event === "messages/complete") {
      // 单个 LLM 调用的消息通道结束，不代表整个流结束，这里忽略
    } else if (event === "error") {
      emit({
        t: "error",
        message: typeof data === "string" ? data : JSON.stringify(data).slice(0, 300),
      });
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // langgraph-api 0.10.x 的 SSE 用 CRLF（\r\n）行结尾，事件之间是 \r\n\r\n；
      // 统一归一化为 \n 后再按 \n\n 切分，否则整条流一个事件都解不出来。
      buf = buf.replace(/\r\n/g, "\n");
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let event = "message";
        const dataLines = [];
        for (const line of raw.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        if (!dataLines.length) continue;
        let data;
        try {
          data = JSON.parse(dataLines.join("\n"));
        } catch {
          continue;
        }
        handleEvent(event, data);
      }
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
    if (!ended) emit({ t: "error", message: e?.message || "流式读取中断" });
    return;
  }

  /* Close out any unfinished stages. */
  if (stageSeen.has("report") && stageSeen.has("supervisor")) finishStage("report");
  else if (stageSeen.size > 0 && lastStage) finishStage(lastStage);
  /* 收尾：把未完成的研究员卡片标记为完成 */
  for (let wid = 1; wid <= nextWid; wid++) {
    emit({ t: "worker", wid, kind: "done", payload: { summary: "研究完成" } });
  }
  emit({ t: "done" });
}

/**
 * Small helper to retry a fetch a couple of times before giving up.
 * Used by the console when the backend may still be starting up.
 */
export async function waitForBackend(baseUrl, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await checkBackend(baseUrl);
    if (r.ok) return r;
    await sleep(700);
  }
  return { ok: false };
}
