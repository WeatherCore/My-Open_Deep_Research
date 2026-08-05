# 🔬 My Open Deep Research（开放深度研究）

<img width="1388" height="298" alt="full_diagram" src="https://github.com/user-attachments/assets/12a2371b-8be2-4219-9b48-90503eb43c69" />

深度研究（Deep Research）已成为最热门的 AI Agent 应用之一
这是一个**简单、可配置、完全开源**的深度研究 Agent，支持多种模型提供商、搜索工具和 MCP 服务器。其性能与许多流行的深度研究 Agent 相当

**一句话理解**：你给它一个研究问题（比如"对比 OpenAI 和 Anthropic 的 AI 安全策略"），它会自动帮你搜索互联网、整理资料，最终生成一份**带引用来源**的深度研究报告。

```
用户提问 → AI 澄清问题 → 制定研究计划 → 多个子 Agent 并行搜索
    → 压缩研究结果 → 生成最终报告（带引用来源）
```

它不是一个简单的问答机器人，而是一个**多 Agent 协作系统**，模拟了人类研究员的工作方式：先理解你要研究什么，把大课题拆成小课题，分头去搜索和阅读，再汇总所有发现，最后写出一份结构化的报告。

<img width="817" height="666" alt="Screenshot 2025-07-13 at 11 21 12 PM" src="https://github.com/user-attachments/assets/052f2ed3-c664-4a4f-8ec2-074349dcaa3f" />

## ✨ 核心特性

- **多 Agent 协作架构**：主管（Supervisor）负责拆分任务，多个研究员（Researcher）并行搜索，模拟真实研究团队的分工
- **自动化研究流程**：用户澄清 → 研究简报 → 并行搜索 → 结果压缩 → 最终报告，全程无需人工干预
- **高质量引用**：最终报告包含来源引用，可追溯、可验证
- **多模型支持**：通过 `init_chat_model()` 支持 OpenAI、Anthropic、Google、Groq、DeepSeek 等主流 LLM 提供商
- **多搜索方式**：默认 Tavily，支持 OpenAI / Anthropic 原生网页搜索、DuckDuckGo、Exa，以及任意 MCP 服务器
- **MCP 兼容**：通过 Model Context Protocol 连接数据库、API 等外部工具和数据源
- **中文友好**：报告自动使用与用户提问一致的语言（中文提问 → 中文报告）

## 🚀 快速开始

1. 克隆仓库并激活虚拟环境：

```bash
git clone https://github.com/langchain-ai/open_deep_research.git
cd open_deep_research
uv venv
source .venv/bin/activate  # Windows 系统：.venv\Scripts\activate
```

2. 安装依赖：

```bash
uv sync
# 或者
uv pip install -r pyproject.toml
```

3. 设置 `.env` 文件来自定义环境变量（用于模型选择、搜索工具和其他配置）：

```bash
cp .env.example .env
```

4. 使用 LangGraph 本地服务器启动 Agent：

```bash
# 安装依赖并启动 LangGraph 服务器
$env:PYTHONUTF8=1; 
.venv\Scripts\langgraph dev --allow-blocking
```

这将在浏览器中打开 LangGraph Studio 界面：

```
- 🚀 API: http://127.0.0.1:2024
- 🎨 Studio 界面: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
- 📚 API 文档: http://127.0.0.1:2024/docs
```

在 `messages` 输入框中提问，然后点击 `Submit`（提交）。在 "Manage Assistants"（管理助手）标签页中选择不同的配置。

### 💻 前端控制台（Web UI）

项目自带一个 React + Vite 编写的 Web 控制台（`frontend/`），提供比 LangGraph Studio 更直观的中文界面：输入研究问题后，实时流式展示「澄清 → 简报 → 主管调度 → 并行研究 → 报告生成」的全过程，并支持模型、搜索方式、并发数等运行配置。

前置条件：Node.js（>= 18）。

```bash
# 1. 先启动后端（见上方"快速开始"）
.venv\Scripts\langgraph dev --allow-blocking

# 2. 新开一个终端，启动前端
cd frontend
npm install    # 首次运行需要
npm run dev
```

启动后在浏览器打开 **http://127.0.0.1:5173**：

- 切到「直连后端」模式（默认后端地址 `http://127.0.0.1:2024`），点击「检测连接」确认后端可达
- 输入研究问题，点击「开始深度研究」，实时观察多智能体运行进度与最终报告
- 「运行配置」面板可调整模型、搜索方式、并发数等，与 `configuration.py` 保持一致
- 无需后端时也可使用「演示模式」，内置模拟运行数据

生产构建（输出到 `frontend/dist/`）：

```bash
cd frontend
npm run build
```

## 🧠 工作原理

### 核心概念

| 概念                 | 说明                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LangGraph**        | 工作流编排框架，把 Agent 流程建模为"有向图"：**节点（Node）** 是函数（如"搜索""压缩""生成报告"），**边（Edge）** 定义执行顺序，**状态（State）** 在节点间传递共享数据 |
| **Agent**            | Agent = LLM + 工具（Tools）。LLM 决定调用哪个工具、传什么参数，工具执行后把结果返回给 LLM，LLM 再决定下一步（**ReAct 模式**）                                         |
| **MCP**              | Model Context Protocol，让 Agent 连接外部工具和服务的标准协议，例如数据库、API 等                                                                                     |
| **子图（Subgraph）** | 本项目采用嵌套图设计：主图之下有主管子图与研究员子图，各层职责分离、状态独立                                                                                          |

### 运行流程

整个系统由 4 个阶段组成，按顺序执行：

```
用户输入研究问题
   ↓
① clarify_with_user        用户澄清（问题不清晰时向用户提问，可通过 allow_clarification=False 跳过）
   ↓
② write_research_brief     将对话转化为结构化的"研究简报"，初始化主管上下文
   ↓
③ research_supervisor      研究主管（子图）
     ├─ 并行启动多个研究员子图（搜索、收集信息、压缩结果）
     ├─ 循环迭代，直到研究完成
     └─ 汇总所有发现，写入主状态 notes
   ↓
④ final_report_generation  汇总所有发现，生成带引用来源的 Markdown 报告
                            （自动使用与用户提问一致的语言，token 超限时自动截断重试）
```

### 关键设计

- **Command 模式**：所有节点函数返回 `Command(goto=..., update=...)` 对象，实现动态条件路由
- **结构化输出**：用 Pydantic 模型约束 LLM 输出格式，保证输出可被程序可靠解析
- **多层错误恢复**：结构化输出自动重试、Token 超限自动截断重试、工具执行安全捕获、摘要超时保护

> 💡 想深入理解每一行代码？请阅读 **[ZHIDAO.md](./ZHIDAO.md)** —— 项目中文导读，包含逐文件代码讲解、运行流程全景图、配置系统详解、复刻建议与学习路线。

## 📁 项目结构

```
open_deep_research/
│
├── README.md                          # 项目说明（本文件）
├── ZHIDAO.md                          # 📖 项目导读（中文，逐文件代码讲解）
├── pyproject.toml                     # Python 项目配置（依赖、元数据）
├── langgraph.json                     # LangGraph 配置文件（主图入口）
├── uv.lock                            # 依赖锁定文件
├── LICENSE                            # MIT 开源许可
├── .env.example                       # 环境变量模板
│
├── src/
│   ├── open_deep_research/            # ⭐ 核心实现（重点阅读）
│   │   ├── deep_researcher.py         # 主图定义（入口文件）
│   │   ├── configuration.py           # 配置管理
│   │   ├── state.py                   # 状态定义（读代码的起点）
│   │   ├── prompts.py                 # 所有提示词模板
│   │   ├── prompts_zh.py              # 中文提示词（中文优化）
│   │   └── utils.py                   # 工具函数（搜索、MCP、token 管理）
│   │
│   └── security/                      # 🔐 安全模块
│       └── auth.py                    # 认证处理
│
├── tests/                             # 🧪 评估脚本
│   ├── run_evaluate.py                # 主评估脚本
│   ├── evaluators.py                  # 评估函数
│   ├── prompts.py                     # 评估提示词
│   ├── pairwise_evaluation.py         # 对比评估工具
│   ├── supervisor_parallel_evaluation.py  # 多线程评估
│   ├── extract_langsmith_data.py      # 提取评估结果
│   └── expt_results/                  # 评估结果（JSONL）
│
└── examples/                          # 📋 示例输出
    ├── arxiv.md                       # ArXiv 研究示例
    ├── pubmed.md                      # PubMed 研究示例
    ├── inference-market.md            # 推理市场分析
    └── inference-market-gpt45.md      # 推理市场分析（GPT-4.5）
```

## ⚙️ 配置说明

### 大语言模型 (LLM) 🧠

Open Deep Research 通过 [init_chat_model() API](https://python.langchain.com/docs/how_to/chat_models_universal_init/) 支持多种 LLM 提供商，不同任务使用不同模型（详见 [configuration.py](src/open_deep_research/configuration.py)）：

| 模型字段              | 默认值                | 用途                    |
| --------------------- | --------------------- | ----------------------- |
| `summarization_model` | `openai:gpt-4.1-mini` | 对搜索 API 结果进行摘要 |
| `research_model`      | `openai:gpt-4.1`      | 驱动搜索 Agent          |
| `compression_model`   | `openai:gpt-4.1`      | 压缩研究发现            |
| `final_report_model`  | `openai:gpt-4.1`      | 撰写最终报告            |

> 注意：所选模型需要支持[结构化输出（structured outputs）](https://python.langchain.com/docs/integrations/chat/)和[工具调用（tool calling）](https://python.langchain.com/docs/how_to/tool_calling/)。OpenRouter 用户请参考[此指南](https://github.com/langchain-ai/open_deep_research/issues/75#issuecomment-2811472408)；通过 Ollama 使用本地模型的用户请参考[设置说明](https://github.com/langchain-ai/open_deep_research/issues/65#issuecomment-2743586318)。

### 搜索 API 🔍

默认使用 [Tavily](https://www.tavily.com/) 搜索 API，完全兼容 MCP，并支持 Anthropic 和 OpenAI 的原生网页搜索。可通过环境变量切换：

```bash
SEARCH_API=tavily       # 默认，需要 TAVILY_API_KEY
SEARCH_API=openai       # OpenAI 原生搜索
SEARCH_API=anthropic    # Anthropic 原生搜索
SEARCH_API=none         # 不使用搜索（仅 MCP）
```

### 其他常用配置

| 配置项                          | 默认值 | 说明                   |
| ------------------------------- | ------ | ---------------------- |
| `max_researcher_iterations`     | 6      | 主管最大迭代次数       |
| `max_react_tool_calls`          | 10     | 研究员最大工具调用次数 |
| `max_concurrent_research_units` | 5      | 最大并行研究员数       |
| `max_content_length`            | 50000  | 网页内容最大字符数     |
| `mcp_config`                    | None   | MCP 服务器配置         |

所有配置均可通过环境变量、LangGraph Studio 界面或直接修改 [configuration.py](src/open_deep_research/configuration.py) 完成。配置加载优先级：**环境变量 > 运行时配置（Studio UI）> 默认值**。

## 📊 评估

Open Deep Research 配置了 [Deep Research Bench](https://huggingface.co/spaces/Ayanami0730/DeepResearch-Leaderboard) 评估。该基准测试包含 100 个博士级别的研究任务（50 个英文，50 个中文），由 22 个领域（如科技、商业与金融）的领域专家精心制作，以模拟真实的深度研究需求。排行榜基于 RACE 分数，使用 LLM 作为评判者（Gemini），根据专家编写的黄金标准报告对研究报告进行评估。

### 使用方法

> 警告：运行全部 100 个示例大约需要花费 $20-$100，具体取决于模型选择。

```bash
# 在 LangSmith 数据集上运行综合评估
python tests/run_evaluate.py
```

```bash
# 将结果提取为可提交到 Deep Research Bench 的 JSONL 文件
python tests/extract_langsmith_data.py --project-name "你的实验名称" --model-name "你的模型名称" --dataset-name "deep_research_bench"
```

生成的 JSONL 文件位于 `tests/expt_results/`，将其移至 Deep Research Bench 仓库的本地克隆，并按照其[快速入门指南](https://github.com/Ayanami0730/deep_research_bench?tab=readme-ov-file#quick-start)提交评估。

### 评估结果

| 名称                     | 提交版本                                                                                                                | 摘要模型            | 研究模型                           | 压缩模型       | 总成本  | 总 Token 数 | RACE 分数 | 实验链接                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------- | -------------- | ------- | ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GPT-5                    | [ca3951d](https://github.com/langchain-ai/open_deep_research/pull/168/commits)                                          | openai:gpt-4.1-mini | openai:gpt-5                       | openai:gpt-4.1 |         | 204,640,896 | 0.4943    | [链接](https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/datasets/6e4766ca-613c-4bda-8bde-f64f0422bbf3/compare?selectedSessions=4d5941c8-69ce-4f3d-8b3e-e3c99dfbd4cc&baseline=undefined) |
| 默认配置                 | [6532a41](https://github.com/langchain-ai/open_deep_research/commit/6532a4176a93cc9bb2102b3d825dcefa560c85d9)           | openai:gpt-4.1-mini | openai:gpt-4.1                     | openai:gpt-4.1 | $45.98  | 58,015,332  | 0.4309    | [链接](https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/datasets/6e4766ca-6[…]ons=cf4355d7-6347-47e2-a774-484f290e79bc&baseline=undefined)                                              |
| Claude Sonnet 4          | [f877ea9](https://github.com/langchain-ai/open_deep_research/pull/163/commits/f877ea93641680879c420ea991e998b47aab9bcc) | openai:gpt-4.1-mini | anthropic:claude-sonnet-4-20250514 | openai:gpt-4.1 | $187.09 | 138,917,050 | 0.4401    | [链接](https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/datasets/6e4766ca-6[…]ons=04f6002d-6080-4759-bcf5-9a52e57449ea&baseline=undefined)                                              |
| Deep Research Bench 提交 | [c0a160b](https://github.com/langchain-ai/open_deep_research/commit/c0a160b57a9b5ecd4b8217c3811a14d8eff97f72)           | openai:gpt-4.1-nano | openai:gpt-4.1                     | openai:gpt-4.1 | $87.83  | 207,005,549 | 0.4344    | [链接](https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/datasets/6e4766ca-6[…]ons=e6647f74-ad2f-4cb9-887e-acb38b5f73c0&baseline=undefined)                                              |

## 🚀 部署与使用

### LangGraph Studio

按照[快速开始](#-快速开始)的说明在本地启动 LangGraph 服务器，并在 LangGraph Studio 上测试 Agent。

### 托管部署

您可以轻松部署到 [LangGraph Platform](https://langchain-ai.github.io/langgraph/concepts/#deployment-options)。

### 开放 Agent 平台（Open Agent Platform）

开放 Agent 平台（OAP）是一个 UI 界面，非技术用户可以在其中构建和配置自己的 Agent。OAP 非常适合让用户配置深度研究器，搭配不同的 MCP 工具和搜索 API，以最适合他们的需求和要解决的问题。

我们已将 Open Deep Research 部署到了公共 OAP 演示实例，您只需添加 API 密钥，即可亲自测试深度研究器：[点击试用](https://oap.langchain.com)

您也可以部署自己的 OAP 实例，并将自己的自定义 Agent（如 Deep Researcher）提供给用户使用：

1. [部署 Open Agent Platform](https://docs.oap.langchain.com/quickstart)
2. [将 Deep Researcher 添加到 OAP](https://docs.oap.langchain.com/setup/agents)

## 📖 深入阅读与学习路线

- **📖 [ZHIDAO.md](./ZHIDAO.md)**：项目中文导读——逐文件代码讲解（`state.py` → `configuration.py` → `prompts.py` → `deep_researcher.py` → `utils.py`）、运行流程全景图、配置系统详解、复刻建议、FAQ
- **🎓 官方免费课程**：[Deep Research with LangGraph](https://academy.langchain.com/courses/deep-research-with-langgraph)（[课程仓库](https://github.com/langchain-ai/deep_research_from_scratch)），学习如何从零构建开放深度研究
- **📝 博客与视频**：[从最初实现到当前版本的演进历程](https://rlancemartin.github.io/2025/07/30/bitter_lesson/) ｜ [Open Deep Research 快速概览](https://blog.langchain.com/open-deep-research/) ｜ [视频](https://www.youtube.com/watch?v=agGiWUpxkhg)

### 推荐阅读顺序

```
第 1 步：读 state.py          → 理解数据结构（约 15 分钟）
第 2 步：读 configuration.py  → 理解可配置项（约 15 分钟）
第 3 步：读 prompts.py        → 理解 AI 如何被引导（约 30 分钟）
第 4 步：读 deep_researcher.py → 理解主流程（约 60 分钟）
第 5 步：读 utils.py          → 理解工具实现（约 30 分钟）
第 6 步：读 tests/            → 理解评估方法（约 20 分钟）
```

### 复刻路线建议

| 阶段             | 目标         | 要点                                                         |
| ---------------- | ------------ | ------------------------------------------------------------ |
| 阶段 1（1-2 天） | 最小可行版本 | 单 Agent + 单搜索工具，去掉主管层，直接研究员搜索 + 生成报告 |
| 阶段 2（2-3 天） | 加入多 Agent | 主管子图 + 并行研究员 + think_tool                           |
| 阶段 3（3-5 天） | 完善功能     | 用户澄清流程、研究压缩、引用来源、token 超限处理             |
| 阶段 4（5-7 天） | 高级功能     | MCP 工具集成、多搜索 API、评估系统、部署上线                 |

### 技术栈学习资源

| 技术       | 学习资源                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| LangGraph  | [官方文档](https://langchain-ai.github.io/langgraph/) + [本项目配套课程](https://academy.langchain.com/courses/deep-research-with-langgraph) |
| LangChain  | [Python LangChain 文档](https://python.langchain.com/docs/)                                                                                  |
| Pydantic   | [Pydantic V2 文档](https://docs.pydantic.dev/latest/)                                                                                        |
| asyncio    | [Python 异步编程官方教程](https://docs.python.org/3/library/asyncio.html)                                                                    |
| Tavily API | [Tavily 文档](https://docs.tavily.com/)                                                                                                      |

## ❓ 常见问题

**Q: `.env` 文件需要哪些环境变量？**

至少需要：
```bash
OPENAI_API_KEY=sk-xxx          # OpenAI 模型密钥
TAVILY_API_KEY=tvly-xxx        # Tavily 搜索密钥
```
可选：`ANTHROPIC_API_KEY`、`GOOGLE_API_KEY` 等（视使用的模型提供商而定）。

**Q: 如何使用 Tavily 之外的其他搜索？**

修改 `.env` 中的 `SEARCH_API` 配置，或在 LangGraph Studio UI 中切换（支持 openai / anthropic / none 等）。

**Q: 可以使用本地模型吗？**

可以，通过 Ollama 支持，模型字符串格式为 `ollama:model_name`。但注意本地模型可能不支持结构化输出和工具调用。

**Q: 研究一个主题大概花多少钱？**

使用默认配置（GPT-4.1），一次完整研究大约 $0.5-$2。评估 100 个主题大约 $45（默认配置）。

**Q: `langgraph.json` 是做什么的？**

这是 LangGraph 工具链的项目配置文件（JSON），告诉 LangGraph CLI 主图的入口点：
```json
{
  "graphs": {
    "agent": "./src/open_deep_research/deep_researcher.py:deep_researcher"
  }
}
```

**Q: 如何自定义提示词？**

直接修改 `src/open_deep_research/prompts.py`（中文优化见 `prompts_zh.py`）。这是影响系统行为最直接的方式。

**Q: `think_tool` 有什么用？**

它是一个"虚拟工具"，让 LLM 可以在工具调用循环中暂停一下，进行策略性思考（如"是否还需要继续搜索？""是否该换个关键词？"），模拟人类研究员"停下来想想"的行为，被证明可以提高研究质量。

## 📜 许可协议

本项目基于 [MIT](LICENSE) 开源许可发布。
