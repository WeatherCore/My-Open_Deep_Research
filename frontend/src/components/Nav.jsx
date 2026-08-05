import { motion } from "motion/react";
import { ArrowUpRight, Moon, Sun } from "@phosphor-icons/react";
import Mark from "./Mark.jsx";

const VIEWS = [
  { id: "console", label: "研究控制台" },
  { id: "architecture", label: "架构" },
  { id: "config", label: "配置" },
  { id: "benchmarks", label: "基准" },
];

export default function Nav({ view, setView, dark, toggleTheme }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:px-6">
        <button
          onClick={() => setView("console")}
          className="flex items-center gap-2.5 outline-none"
          aria-label="回到控制台"
        >
          <Mark size={26} />
          <span className="text-[15px] font-semibold tracking-tight">
            Open Deep Research
          </span>
        </button>

        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`relative rounded-lg px-3 py-1.5 text-[13.5px] outline-none transition-colors ${view === v.id
                  ? "text-tx"
                  : "text-mut hover:text-tx"
                }`}
            >
              {view === v.id && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-surface2 border border-line"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{v.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a
            href="https://github.com/WeatherCore/My-Open-Deep-Research"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] text-mut transition-colors hover:border-line2 hover:text-tx md:flex"
          >
            GitHub
            <ArrowUpRight size={13} weight="bold" />
          </a>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-mut transition-colors hover:text-tx"
            aria-label={dark ? "切换为浅色模式" : "切换为深色模式"}
          >
            {dark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
          </button>
        </div>
      </div>
    </header>
  );
}
