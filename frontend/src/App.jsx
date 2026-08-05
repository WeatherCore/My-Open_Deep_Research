import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, GitBranch, Globe, PuzzlePiece } from "@phosphor-icons/react";
import Nav from "./components/Nav.jsx";
import ConsoleView from "./views/ConsoleView.jsx";

const ArchitectureView = lazy(() => import("./views/ArchitectureView.jsx"));
const ConfigurationView = lazy(() => import("./views/ConfigurationView.jsx"));
const BenchmarksView = lazy(() => import("./views/BenchmarksView.jsx"));

function useTheme() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("odr-theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  }, []);
  return { dark, toggle };
}

const VIEWS = {
  console: ConsoleView,
  architecture: ArchitectureView,
  config: ConfigurationView,
  benchmarks: BenchmarksView,
};

export default function App() {
  const { dark, toggle } = useTheme();
  const [view, setView] = useState("console");
  const View = VIEWS[view];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Nav view={view} setView={setView} dark={dark} toggleTheme={toggle} />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex h-[50vh] items-center justify-center text-[13px] text-mut">
              加载中…
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <View />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[380px]">
              <p className="text-[14px] font-semibold">Open Deep Research</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-mut">
                基于 LangGraph 的开源深度研究 Agent 前端控制台。
                演示模式无需后端即可体验完整流程，直连模式对接本地 LangGraph 服务实时运行。
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-faint">技术栈</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: GitBranch, label: "LangGraph" },
                  { icon: Globe, label: "LangChain" },
                  { icon: PuzzlePiece, label: "MCP" },
                  { icon: ArrowUpRight, label: "Tavily" },
                ].map((t) => (
                  <span
                    key={t.label}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-[11.5px] text-mut"
                  >
                    <t.icon size={12} weight="bold" className="text-faint" />
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-faint">链接</p>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://github.com/langchain-ai/open_deep_research"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-mut transition-colors hover:text-tx"
                >
                  GitHub 仓库
                  <ArrowUpRight size={13} weight="bold" />
                </a>
                <a
                  href="https://blog.langchain.com/open-deep-research/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-mut transition-colors hover:text-tx"
                >
                  官方博客
                  <ArrowUpRight size={13} weight="bold" />
                </a>
                <a
                  href="https://huggingface.co/spaces/Ayanami0730/DeepResearch-Leaderboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-mut transition-colors hover:text-tx"
                >
                  Deep Research Bench
                  <ArrowUpRight size={13} weight="bold" />
                </a>
              </div>
            </div>
          </div>

          <p className="mt-8 border-t border-line pt-5 font-mono text-[11px] text-faint">
            open_deep_research / frontend console / langchain-ai
          </p>
        </div>
      </footer>
    </div>
  );
}
