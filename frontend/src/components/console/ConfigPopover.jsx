import { SlidersHorizontal } from "@phosphor-icons/react";

const SEARCH_OPTIONS = [
  { value: "tavily", label: "Tavily" },
  { value: "openai", label: "OpenAI 原生搜索" },
  { value: "anthropic", label: "Anthropic 原生搜索" },
  { value: "none", label: "关闭搜索" },
];

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-[12.5px] font-medium">{label}</label>
        {hint && <span className="font-mono text-[10.5px] text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[13px] outline-none transition-colors focus:border-accent";

export default function ConfigPopover({ open, config, setConfig }) {
  if (!open) return null;

  const set = (k, v) => setConfig((c) => ({ ...c, [k]: v }));

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[300px] rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-black/10">
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal size={14} weight="bold" className="text-accent" />
        <span className="text-[13px] font-semibold">运行配置</span>
        <span className="ml-auto font-mono text-[10px] text-faint">
          映射 configuration.py
        </span>
      </div>

      <div className="space-y-4">
        <Field label="搜索 API" hint="search_api">
          <select
            className={inputCls}
            value={config.search_api}
            onChange={(e) => set("search_api", e.target.value)}
          >
            {SEARCH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="允许澄清提问" hint="allow_clarification">
          <button
            onClick={() => set("allow_clarification", !config.allow_clarification)}
            className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[13px] transition-colors ${config.allow_clarification
              ? "border-accent/50 bg-accent-soft text-tx"
              : "border-line text-mut"
              }`}
          >
            {config.allow_clarification ? "开启" : "关闭"}
            <span
              className={`h-4 w-7 rounded-full p-0.5 transition-colors ${config.allow_clarification ? "bg-accent" : "bg-line2"
                }`}
            >
              <span
                className={`block h-3 w-3 rounded-full bg-surface transition-transform ${config.allow_clarification ? "translate-x-3" : ""
                  }`}
              />
            </span>
          </button>
        </Field>

        <Field label="最大并发研究单元" hint={`${config.max_concurrent_research_units}`}>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={config.max_concurrent_research_units}
            onChange={(e) => set("max_concurrent_research_units", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <div className="mt-1 flex justify-between font-mono text-[9.5px] text-faint">
            <span>1</span>
            <span>10</span>
          </div>
        </Field>

        <Field label="主管最大迭代" hint={`${config.max_researcher_iterations}`}>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={config.max_researcher_iterations}
            onChange={(e) => set("max_researcher_iterations", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>

        <Field label="研究员最大工具轮次" hint={`${config.max_react_tool_calls}`}>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={config.max_react_tool_calls}
            onChange={(e) => set("max_react_tool_calls", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>

        <Field label="研究模型" hint="research_model">
          <input
            className={inputCls}
            value={config.research_model}
            onChange={(e) => set("research_model", e.target.value)}
            placeholder="openai:gpt-4.1"
          />
        </Field>

        <Field label="摘要模型" hint="summarization_model">
          <input
            className={inputCls}
            value={config.summarization_model}
            onChange={(e) => set("summarization_model", e.target.value)}
            placeholder="deepseek:deepseek-chat"
          />
        </Field>

        <Field label="内容长度上限" hint={`${config.max_content_length ?? 50000} 字符`}>
          <input
            type="range"
            min="3000"
            max="50000"
            step="1000"
            value={config.max_content_length ?? 50000}
            onChange={(e) => set("max_content_length", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>

      </div>
    </div>
  );
}
