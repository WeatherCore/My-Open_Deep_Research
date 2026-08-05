import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  CircleNotch,
  MagnifyingGlass,
  Play,
  Stop,
  TerminalWindow,
  WarningCircle,
  CaretRight,
} from "@phosphor-icons/react";
import Pipeline from "../components/Pipeline.jsx";
import EventLog from "../components/console/EventLog.jsx";
import WorkerCards from "../components/console/WorkerCards.jsx";
import ReportView from "../components/console/ReportView.jsx";
import ConfigPopover from "../components/console/ConfigPopover.jsx";
import { runDemo } from "../lib/demo.js";
import { checkBackend, listAssistants, startLiveRun } from "../lib/api.js";
import { DEFAULT_BASE_URL, DEFAULT_CONFIG, EXAMPLES } from "../lib/constants.js";

const LS = {
  mode: "odr-mode",
  url: "odr-baseurl",
  config: "odr-config",
  topic: "odr-topic",
};

function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export default function ConsoleView() {
  const [mode, setMode] = useState(() => loadLS(LS.mode, "demo"));
  const [baseUrl, setBaseUrl] = useState(() => loadLS(LS.url, DEFAULT_BASE_URL));
  const [config, setConfig] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...loadLS(LS.config, {}),
  }));
  const [topic, setTopic] = useState(() => loadLS(LS.topic, ""));
  const [configOpen, setConfigOpen] = useState(false);

  const [running, setRunning] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [logs, setLogs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [brief, setBrief] = useState(null);
  const [question, setQuestion] = useState(null);
  const [report, setReport] = useState("");
  const [stats, setStats] = useState({ iterations: 0, searches: 0, toolCalls: 0, workers: 0 });
  const [error, setError] = useState(null);
  const [backend, setBackend] = useState({ checked: false, ok: false, name: null });
  const [checking, setChecking] = useState(false);

  const runRef = useRef({ abort: null });
  const reportRef = useRef(null);
  const scrolledToReport = useRef(false);

  /* persist prefs */
  useEffect(() => {
    try {
      localStorage.setItem(LS.mode, JSON.stringify(mode));
      localStorage.setItem(LS.url, JSON.stringify(baseUrl));
      localStorage.setItem(LS.config, JSON.stringify(config));
      localStorage.setItem(LS.topic, JSON.stringify(topic));
    } catch {}
  }, [mode, baseUrl, config, topic]);

  const emit = useCallback((ev) => {
    switch (ev.t) {
      case "stage":
        setStatuses((p) => ({ ...p, [ev.id]: ev.status }));
        break;
      case "log":
        setLogs((p) => (p.length > 400 ? [...p.slice(-380), ev] : [...p, ev]));
        break;
      case "worker": {
        setWorkers((p) => {
          const idx = p.findIndex((w) => w.id === ev.wid);
          if (ev.kind === "start") {
            if (idx >= 0) return p;
            return [...p, { id: ev.wid, topic: ev.payload.topic, status: "running", actions: [] }];
          }
          if (idx < 0) return p;
          const w = p[idx];
          if (ev.kind === "search")
            return p.map((x, i) =>
              i === idx ? { ...x, actions: [...x.actions, { kind: "search", ...ev.payload }] } : x
            );
          if (ev.kind === "think")
            return p.map((x, i) =>
              i === idx ? { ...x, actions: [...x.actions, { kind: "think", ...ev.payload }] } : x
            );
          if (ev.kind === "done")
            return p.map((x, i) =>
              i === idx
                ? { ...x, status: "done", actions: [...x.actions, { kind: "done", ...ev.payload }] }
                : x
            );
          return p;
        });
        break;
      }
      case "brief":
        setBrief(ev.text);
        break;
      case "question":
        setQuestion(ev.text);
        break;
      case "report":
        setReport((p) => p + ev.chunk);
        setStreaming(true);
        break;
      case "report_done":
        setReport(ev.text);
        setStreaming(false);
        break;
      case "stats":
        setStats(ev.stats);
        break;
      case "error":
        setError(ev.message);
        setRunning(false);
        setStreaming(false);
        break;
      case "done":
        setRunning(false);
        setStreaming(false);
        break;
      default:
        break;
    }
  }, []);

  /* scroll report into view once it starts streaming */
  useEffect(() => {
    if (streaming && !scrolledToReport.current && report.length > 40) {
      scrolledToReport.current = true;
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [streaming, report.length]);

  const detectBackend = useCallback(async () => {
    setChecking(true);
    const res = await checkBackend(baseUrl);
    let name = null;
    if (res.ok) {
      try {
        const { picked } = await listAssistants(baseUrl);
        name = picked?.graph_id || picked?.name || null;
      } catch {}
    }
    setBackend({ checked: true, ok: res.ok, name });
    setChecking(false);
    return res.ok;
  }, [baseUrl]);

  const startRun = async () => {
    const t = topic.trim();
    if (!t || running) return;
    setError(null);
    setLogs([]);
    setWorkers([]);
    setBrief(null);
    setQuestion(null);
    setReport("");
    setStreaming(false);
    setStatuses({});
    setStats({ iterations: 0, searches: 0, toolCalls: 0, workers: 0 });
    scrolledToReport.current = false;
    setRunning(true);

    const controller = new AbortController();
    runRef.current.abort = () => controller.abort();

    try {
      if (mode === "demo") {
        await runDemo(t, config, emit, { signal: controller.signal });
      } else {
        const ok = await detectBackend();
        if (!ok) throw new Error("无法连接 LangGraph 后端");
        const { picked } = await listAssistants(baseUrl);
        if (!picked)
          throw new Error("未找到可用助手，请确认 langgraph dev 已加载 Deep Researcher 图");
        emit({
          t: "log",
          at: new Date().toTimeString().slice(0, 8),
          actor: "client",
          tag: "connected",
          msg: `已连接 ${baseUrl}，助手 ${picked.graph_id || picked.assistant_id}`,
        });
        await startLiveRun({
          baseUrl,
          assistantId: picked.assistant_id,
          input: { messages: [{ role: "user", content: t }] },
          configurable: config,
          emit,
          opts: { signal: controller.signal },
        });
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
      emit({ t: "error", message: e?.message || "运行失败" });
    }
  };

  const stopRun = () => {
    emit({
      t: "log",
      at: new Date().toTimeString().slice(0, 8),
      actor: "client",
      tag: "stop",
      msg: "已手动停止",
    });
    runRef.current.abort?.();
    setRunning(false);
    setStreaming(false);
  };

  const hasRunContent = logs.length > 0 || report || error || question;

  return (
    <section className="relative">
      {/* ambient dot grid */}
      <div className="dotgrid pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6">
        {/* hero */}
        <div className="max-w-[760px]">
          <h1 className="text-[30px] font-bold leading-[1.15] tracking-tight sm:text-[38px]">
            让多智能体完成一次
            <span className="text-accent">博士级深度研究</span>
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-mut">
            输入研究问题，主管研究员拆解任务，多个研究员并行搜索、反思与压缩，最终产出结构化研究报告。
            基于 LangGraph 状态机编排，支持 Tavily 与原生搜索、MCP 工具接入。
          </p>
        </div>

        {/* mode bar */}
        <div className="relative mt-7 flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-line bg-surface p-1">
            {[
              { id: "demo", label: "演示模式" },
              { id: "live", label: "直连后端" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  mode === m.id ? "text-tx" : "text-mut hover:text-tx"
                }`}
              >
                {mode === m.id && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-lg bg-surface2 border border-line"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setConfigOpen((v) => !v)}
            className="relative flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-mut transition-colors hover:text-tx"
          >
            <TerminalWindow size={15} weight="bold" />
            运行配置
          </button>
          <ConfigPopover open={configOpen} config={config} setConfig={setConfig} />

          {mode === "live" && (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-mut">
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                spellCheck={false}
                className="w-[210px] rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[12px] outline-none focus:border-accent"
                placeholder={DEFAULT_BASE_URL}
              />
              <button
                onClick={detectBackend}
                disabled={checking}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 transition-colors hover:border-line2 hover:text-tx disabled:opacity-50"
              >
                {checking ? (
                  <CircleNotch size={13} weight="bold" className="animate-spin" />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      backend.checked
                        ? backend.ok
                          ? "bg-ok"
                          : "bg-danger"
                        : "bg-line2"
                    }`}
                  />
                )}
                检测连接
              </button>
              {backend.checked && backend.ok && backend.name && (
                <span className="font-mono text-[11px] text-faint">
                  {backend.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* input card */}
        <div className="relative mt-6 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startRun();
            }}
            rows={3}
            disabled={running}
            placeholder="例如：2026 年 AI 推理市场的竞争格局分析"
            className="w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-faint focus:border-accent disabled:opacity-60"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-faint">示例：</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setTopic(ex)}
                disabled={running}
                className="rounded-full border border-line bg-bg px-3 py-1 text-[12px] text-mut transition-colors hover:border-accent/60 hover:text-tx disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {running ? (
                <button
                  onClick={stopRun}
                  className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2 text-[13.5px] font-semibold text-danger transition-colors hover:bg-danger/15"
                >
                  <Stop size={15} weight="fill" />
                  停止
                </button>
              ) : (
                <button
                  onClick={startRun}
                  disabled={!topic.trim()}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-[13.5px] font-semibold text-accent-on transition-all hover:brightness-105 active:translate-y-px disabled:opacity-40"
                >
                  <Play size={15} weight="fill" />
                  开始深度研究
                </button>
              )}
            </div>
          </div>
        </div>

        {/* error panel */}
        {error && (
          <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-4">
            <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-danger">运行失败</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mut">{error}</p>
              {mode === "live" && (
                <p className="mt-2 font-mono text-[12px] leading-relaxed text-mut">
                  启动命令：uvx --refresh --from "langgraph-cli[inmem]" --with-editable . --python
                  3.11 langgraph dev --allow-blocking
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={startRun}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] text-mut transition-colors hover:text-tx"
              >
                重试
              </button>
              {mode === "live" && (
                <button
                  onClick={() => {
                    setMode("demo");
                    setError(null);
                  }}
                  className="rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-on"
                >
                  切换到演示模式
                </button>
              )}
            </div>
          </div>
        )}

        {/* run area */}
        {(running || hasRunContent) && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
            {/* left column */}
            <div className="space-y-4">
              <Pipeline statuses={statuses} />

              {/* stats */}
              <div className="rounded-2xl border border-line bg-surface p-4">
                <span className="text-[13px] font-semibold">运行统计</span>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {[
                    { label: "研究迭代", value: stats.iterations },
                    { label: "并发研究员", value: stats.workers },
                    { label: "搜索次数", value: stats.searches },
                    { label: "工具调用", value: stats.toolCalls },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-surface2 border border-line px-3 py-2">
                      <p className="font-mono text-[20px] font-semibold leading-none text-tx">
                        {s.value}
                      </p>
                      <p className="mt-1.5 text-[11px] text-faint">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* research brief */}
              {brief && (
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <span className="text-[13px] font-semibold">研究简报</span>
                  <p className="mt-2 text-[13px] leading-relaxed text-mut">{brief}</p>
                </div>
              )}

              {/* clarification question */}
              {question && (
                <div className="rounded-2xl border border-warn/40 bg-warn/10 p-4">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-warn">
                    <WarningCircle size={14} weight="fill" />
                    系统向你提问
                  </span>
                  <p className="mt-2 text-[13px] leading-relaxed text-mut">{question}</p>
                  <p className="mt-2 text-[11.5px] text-faint">
                    直连模式下，可在对话中补充信息后重新发起研究。
                  </p>
                </div>
              )}
            </div>

            {/* right column */}
            <div className="min-w-0 space-y-4">
              {workers.length > 0 && (
                <div>
                  <p className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold">
                    并行研究员
                    <span className="font-mono text-[11px] font-normal text-faint">
                      {workers.filter((w) => w.status === "done").length}/{workers.length} 完成
                    </span>
                  </p>
                  <WorkerCards workers={workers} />
                </div>
              )}

              {running && workers.length === 0 && !report && (
                <div className="flex h-[180px] items-center justify-center rounded-2xl border border-line bg-surface">
                  <span className="flex items-center gap-2.5 text-[13.5px] text-mut">
                    <CircleNotch size={17} weight="bold" className="animate-spin text-accent" />
                    研究员正在执行搜索…
                  </span>
                </div>
              )}

              <EventLog logs={logs} running={running} />

              <div ref={reportRef}>
                <ReportView text={report} demo={mode === "demo"} streaming={streaming} />
              </div>
            </div>
          </div>
        )}

        {/* idle empty state */}
        {!running && !hasRunContent && (
          <div className="mt-8 rounded-2xl border border-dashed border-line2 bg-surface/50 px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <MagnifyingGlass size={28} weight="bold" />
            </span>
            <h2 className="mt-5 text-[17px] font-semibold">输入一个问题，开始深度研究</h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-mut">
              演示模式内置模拟运行，无需后端即可完整体验多智能体研究流程；
              直连模式对接本地 LangGraph 服务，实时流式展示真实运行过程。
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {EXAMPLES.slice(0, 3).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setTopic(ex)}
                  className="flex items-center gap-1 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12.5px] text-mut transition-colors hover:border-accent/60 hover:text-tx"
                >
                  {ex}
                  <CaretRight size={12} weight="bold" className="text-faint" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
