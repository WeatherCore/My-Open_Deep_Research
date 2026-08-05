/**
 * Shared constants: graph stages, configuration mirror (from
 * src/open_deep_research/configuration.py), benchmark data (from README),
 * example prompts and tool descriptions.
 */

/** Pipeline stages in execution order. ids are used by the demo runner and
 *  the live API normalizer to drive the UI. */
export const STAGES = [
  {
    id: "clarify",
    label: "澄清需求",
    en: "clarify_with_user",
    desc: "分析用户消息，判断研究范围是否清晰，必要时向用户提问。",
  },
  {
    id: "brief",
    label: "撰写研究简报",
    en: "write_research_brief",
    desc: "将用户消息转化为结构化的研究简报，作为研究的纲领。",
  },
  {
    id: "supervisor",
    label: "主管调度",
    en: "research_supervisor",
    desc: "规划研究策略，用 ConductResearch 将子任务并行分发给研究员。",
  },
  {
    id: "researcher",
    label: "并行研究",
    en: "researcher ×N",
    desc: "多个研究员并行执行搜索、反思与信息收集。",
  },
  {
    id: "compress",
    label: "压缩发现",
    en: "compress_research",
    desc: "将每个研究员的原始笔记压缩为结构化摘要。",
  },
  {
    id: "report",
    label: "生成报告",
    en: "final_report_generation",
    desc: "综合全部研究发现，撰写最终结构化研究报告。",
  },
];

export const STAGE_ORDER = STAGES.map((s) => s.id);

/** Tool descriptions shown across views (mirrors utils.py). */
export const TOOLS = [
  {
    name: "think_tool",
    cn: "反思工具",
    desc: "每次搜索后暂停，分析已得信息、评估缺口、决定下一步。",
  },
  {
    name: "ConductResearch",
    cn: "任务下发",
    desc: "主管向子研究员分发一个高细节的研究子任务。",
  },
  {
    name: "ResearchComplete",
    cn: "完成信号",
    desc: "研究员或主管声明研究完成，进入压缩与报告阶段。",
  },
  {
    name: "web_search",
    cn: "联网搜索",
    desc: "Tavily 检索加摘要模型提炼，或 OpenAI / Anthropic 原生搜索。",
  },
  {
    name: "MCP tools",
    cn: "MCP 工具",
    desc: "通过 Model Context Protocol 接入任意外部工具集。",
  },
];

/** Configuration groups, a faithful mirror of configuration.py. */
export const CONFIG_GROUPS = [
  {
    key: "models",
    title: "模型配置",
    desc: "四个阶段各自使用独立模型，通过 init_chat_model 统一初始化。",
    items: [
      {
        field: "summarization_model",
        label: "摘要模型",
        value: "deepseek:deepseek-chat",
        note: "对 Tavily 搜索结果进行摘要，默认 max_tokens 8192",
      },
      {
        field: "research_model",
        label: "研究模型",
        value: "deepseek:deepseek-chat",
        note: "驱动主管与研究员，默认 max_tokens 10000",
      },
      {
        field: "compression_model",
        label: "压缩模型",
        value: "deepseek:deepseek-chat",
        note: "压缩研究员笔记为结构化摘要，默认 max_tokens 8192",
      },
      {
        field: "final_report_model",
        label: "报告模型",
        value: "deepseek:deepseek-chat",
        note: "撰写最终报告，默认 max_tokens 10000",
      },
    ],
  },
  {
    key: "search",
    title: "搜索配置",
    desc: "支持 Tavily、OpenAI 原生搜索、Anthropic 原生搜索或关闭搜索。",
    items: [
      {
        field: "search_api",
        label: "搜索 API",
        value: "tavily",
        note: "可选 tavily / openai / anthropic / none",
      },
      {
        field: "max_content_length",
        label: "内容长度上限",
        value: "50000",
        note: "网页内容进入摘要模型前的最大字符数",
      },
      {
        field: "max_structured_output_retries",
        label: "结构化输出重试",
        value: "3",
        note: "结构化输出调用失败时的最大重试次数",
      },
    ],
  },
  {
    key: "flow",
    title: "研究流程",
    desc: "控制研究的并发、迭代与工具调用上限。",
    items: [
      {
        field: "allow_clarification",
        label: "允许澄清",
        value: "true",
        note: "研究范围不清晰时，先向用户提问",
      },
      {
        field: "max_concurrent_research_units",
        label: "最大并发研究单元",
        value: "5",
        note: "并行运行的研究员数量，过多可能触发限流",
      },
      {
        field: "max_researcher_iterations",
        label: "主管最大迭代",
        value: "6",
        note: "主管反思与追问的最大轮数",
      },
      {
        field: "max_react_tool_calls",
        label: "研究员最大工具轮次",
        value: "10",
        note: "单个研究员内工具调用循环的最大轮数",
      },
    ],
  },
  {
    key: "mcp",
    title: "MCP 配置",
    desc: "通过 Model Context Protocol 扩展研究员可用的外部工具。",
    items: [
      {
        field: "mcp_config.url",
        label: "MCP 服务地址",
        value: "null",
        note: "streamable_http 传输的 MCP 服务器 URL",
      },
      {
        field: "mcp_config.tools",
        label: "可用工具列表",
        value: "null",
        note: "仅暴露白名单内的 MCP 工具，避免命名冲突",
      },
      {
        field: "mcp_config.auth_required",
        label: "需要鉴权",
        value: "false",
        note: "开启后通过 OAuth token exchange 获取访问令牌",
      },
      {
        field: "mcp_prompt",
        label: "MCP 提示词",
        value: "null",
        note: "关于可用 MCP 工具的额外使用说明",
      },
    ],
  },
];

/** Real benchmark numbers from the project README (Deep Research Bench). */
export const BENCHMARKS = [
  {
    name: "GPT-5",
    summarization: "openai:gpt-4.1-mini",
    research: "openai:gpt-5",
    compression: "openai:gpt-4.1",
    cost: null,
    tokens: "204,640,896",
    race: 0.4943,
    rank: 1,
  },
  {
    name: "Claude Sonnet 4",
    summarization: "openai:gpt-4.1-mini",
    research: "anthropic:claude-sonnet-4-20250514",
    compression: "openai:gpt-4.1",
    cost: "$187.09",
    tokens: "138,917,050",
    race: 0.4401,
    rank: 2,
  },
  {
    name: "Deep Research Bench 提交",
    summarization: "openai:gpt-4.1-nano",
    research: "openai:gpt-4.1",
    compression: "openai:gpt-4.1",
    cost: "$87.83",
    tokens: "207,005,549",
    race: 0.4344,
    rank: 3,
  },
  {
    name: "默认配置",
    summarization: "openai:gpt-4.1-mini",
    research: "openai:gpt-4.1",
    compression: "openai:gpt-4.1",
    cost: "$45.98",
    tokens: "58,015,332",
    race: 0.4309,
    rank: 4,
  },
];

/** Example research topics shown under the input. */
export const EXAMPLES = [
  "2026 年 AI 推理市场的竞争格局分析",
  "开源大模型与闭源大模型的优劣势对比",
  "多智能体编排框架：LangGraph 与竞品对比",
  "量子计算行业最新投资机会盘点",
];

/** Default LangGraph dev server. */
export const DEFAULT_BASE_URL = "http://127.0.0.1:2024";

/** Default run configuration (mirrors configuration.py defaults). */
export const DEFAULT_CONFIG = {
  search_api: "tavily",
  allow_clarification: true,
  max_concurrent_research_units: 5,
  max_researcher_iterations: 6,
  max_react_tool_calls: 10,
  summarization_model: "deepseek:deepseek-chat",
  research_model: "deepseek:deepseek-chat",
  compression_model: "deepseek:deepseek-chat",
  final_report_model: "deepseek:deepseek-chat",
  summarization_model_max_tokens: 8192,
  research_model_max_tokens: 10000,
  compression_model_max_tokens: 8192,
  final_report_model_max_tokens: 10000,
  max_content_length: 50000,
};
