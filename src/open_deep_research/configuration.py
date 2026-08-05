"""Configuration management for the Open Deep Research system."""
# 整个 Agent 图本次执行固定不变的全局参数（并发上限、搜索引擎、重试次数）

import os
from enum import Enum
from typing import Any, List, Optional

from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

# 搜索服务商枚举
class SearchAPI(Enum):
    """Enumeration of available search API providers."""
    
    ANTHROPIC = "anthropic" # Claude 原生内置联网搜索
    OPENAI = "openai" # GPT 原生内置联网搜索
    TAVILY = "tavily" # 独立联网搜索 API（项目默认，最通用，任何大模型都能用）
    NONE = "none" # 关闭搜索，只依靠模型自身知识库
#想接入本地向量库检索，可以在这里新增一个枚举值 LOCAL_CHROMA

# MCP 服务器配置
class MCPConfig(BaseModel):
    """Configuration for Model Context Protocol (MCP) servers."""
    
    url: Optional[str] = Field(
        default=None,
        optional=True,
    )
    """The URL of the MCP server"""
     # 远程 MCP 服务地址
    tools: Optional[List[str]] = Field(
        default=None,
        optional=True,
    )
    """The tools to make available to the LLM"""
     # 指定启用哪些远端工具
    auth_required: Optional[bool] = Field(
        default=False,
        optional=True,
    )
    """Whether the MCP server requires authentication"""
     # 访问远程服务是否需要鉴权

# 整个项目所有节点共享的静态参数，图一旦启动，全程不会变更
class Configuration(BaseModel):
    """Main configuration class for the Deep Research agent."""
    
    # LLM 结构化输出最大重试次数
    max_structured_output_retries: int = Field(
        default=3,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 3,
                "min": 1,
                "max": 10,
                "description": "Maximum number of retries for structured output calls from models"
            }
        }
    )
    # 是否开启【人在回路需求澄清】，对应 state.py 里面的ClarifyWithUser
    allow_clarification: bool = Field(
        default=True,
        metadata={
            "x_oap_ui_config": {
                "type": "boolean",
                "default": True,
                "description": "Whether to allow the researcher to ask the user clarifying questions before starting research"
            }
        }
    )
    # 并行研究员最大数量，也就是主管 Agent 最多一次性同时启动多少个研究员子图
    max_concurrent_research_units: int = Field(
        default=5,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 5,
                "min": 1,
                "max": 20,
                "step": 1,
                "description": "Maximum number of research units to run concurrently. This will allow the researcher to use multiple sub-agents to conduct research. Note: with more concurrency, you may run into rate limits."
            }
        }
    )
    # 选择使用哪一套搜索工具，默认 Tavily。所有研究员节点读取这个配置，决定调用哪个搜索接口
    search_api: SearchAPI = Field(
        default=SearchAPI.TAVILY,
        metadata={
            "x_oap_ui_config": {
                "type": "select",
                "default": "tavily",
                "description": "Search API to use for research. NOTE: Make sure your Researcher Model supports the selected search API.",
                "options": [
                    {"label": "Tavily", "value": SearchAPI.TAVILY.value},
                    {"label": "OpenAI Native Web Search", "value": SearchAPI.OPENAI.value},
                    {"label": "Anthropic Native Web Search", "value": SearchAPI.ANTHROPIC.value},
                    {"label": "None", "value": SearchAPI.NONE.value}
                ]
            }
        }
    )
    # 控制主管 Supervisor 最多进行多少次调研反思、追加追问（反复派发任务给研究员）
    max_researcher_iterations: int = Field(
        default=6,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 6,
                "min": 1,
                "max": 10,
                "step": 1,
                "description": "Maximum number of research iterations for the Research Supervisor. This is the number of times the Research Supervisor will reflect on the research and ask follow-up questions."
            }
        }
    )
    # 单个研究员内部一轮最多工具调用次数，对应每个研究员子 Agent 内部的 ReAct 循环（反复搜网页）
    max_react_tool_calls: int = Field(
        default=10,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 10,
                "min": 1,
                "max": 30,
                "step": 1,
                "description": "Maximum number of tool calling iterations to make in a single researcher step."
            }
        }
    )
    # 网页原始内容摘要模型
    summarization_model: str = Field(
        default="openai:gpt-4.1-mini",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:gpt-4.1-mini",
                "description": "Model for summarizing research results from Tavily search results"
            }
        }
    )
    # 摘要输出 token 上限
    summarization_model_max_tokens: int = Field(
        default=8192,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 8192,
                "description": "Maximum output tokens for summarization model"
            }
        }
    )
    # 最大网页原始字符长度。规则：抓取网页正文之后，如果原文字符超过 50000，先截断，再送入摘要模型
    max_content_length: int = Field(
        default=50000,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 50000,
                "min": 1000,
                "max": 200000,
                "description": "Maximum character length for webpage content before summarization"
            }
        }
    )
    # 研究员主体模型，每个并行研究员 Agent 自身使用的大模型
    research_model: str = Field(
        default="openai:gpt-4.1",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:gpt-4.1",
                "description": "Model for conducting research. NOTE: Make sure your Researcher Model supports the selected search API."
            }
        }
    )
    research_model_max_tokens: int = Field(
        default=10000,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 10000,
                "description": "Maximum output tokens for research model"
            }
        }
    )
    # 多研究员的结果汇总压缩模型
    compression_model: str = Field(
        default="openai:gpt-4.1",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:gpt-4.1",
                "description": "Model for compressing research findings from sub-agents. NOTE: Make sure your Compression Model supports the selected search API."
            }
        }
    )
    compression_model_max_tokens: int = Field(
        default=8192,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 8192,
                "description": "Maximum output tokens for compression model"
            }
        }
    )
    # 最终报告生成模型
    final_report_model: str = Field(
        default="openai:gpt-4.1",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:gpt-4.1",
                "description": "Model for writing the final report from all research findings"
            }
        }
    )
    final_report_model_max_tokens: int = Field(
        default=10000,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 10000,
                "description": "Maximum output tokens for final report model"
            }
        }
    )
    # MCP 远程工具服务配置（前面讲过）
    mcp_config: Optional[MCPConfig] = Field(
        default=None,
        optional=True,
        metadata={
            "x_oap_ui_config": {
                "type": "mcp",
                "description": "MCP server configuration"
            }
        }
    )
    # 给大模型追加额外提示词，用来告知 LLM：当前可以使用哪些 MCP 远程工具、工具使用规范。
    # 没有启用 MCP 的情况下，该字段无效
    mcp_prompt: Optional[str] = Field(
        default=None,
        optional=True,
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "description": "Any additional instructions to pass along to the Agent regarding the MCP tools that are available to it."
            }
        }
    )

    # 专门用来从 RunnableConfig（LangGraph 运行时配置） + 系统环境变量，自动组装出完整 Configuration 对象也就是第45行定义的那个项目预设参数（网页最大截取长度、摘要模型名称、重试次数等）
    # @classmethod 指定这个是类方法，可以不实例化直接调用
    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
        # 接收 LangChain 的运行时配置。你在调用 agent.invoke(..., config=config) 时传入的{"configurable": {"thread_id": "123", "search_api": "tavily"}}
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""

        # 把内层的 {"thread_id": "123", ...} 取出来
        configurable = config.get("configurable", {}) if config else {}
        # 获取所有字段名
        field_names = list(cls.model_fields.keys())
        # 构建“值”字典，左键（Key）右值（Value）
        values: dict[str, Any] = {
            # 读取.env 文件的 SEARCH_API=xxx ，如果没找到就取 configurable 里的值
            field_name: os.environ.get(field_name.upper(), configurable.get(field_name))
            for field_name in field_names
        }

        # 过滤掉值是 None 的字段（因为 Pydantic 会用字段定义里的 default 值来填充）
        # 把剩下的键值对作为关键字参数，传入 Configuration 类，生成最终的配置对象
        return cls(**{k: v for k, v in values.items() if v is not None})

    # Pydantic V2 配置项：arbitrary_types_allowed=True
    # 允许模型里面存放无法自动序列化的自定义类型（比如部分 LangGraph 原生对象、自定义枚举）。
    # 如果关闭这个选项，遇到Enum、自定义对象字段，Pydantic 会直接抛校验异常。
    # 在 Agent 项目里几乎都会开启
    class Config:
        """Pydantic configuration."""
        
        arbitrary_types_allowed = True


# config = {
#     "configurable": {
#         # ========== 【业务静态配置】从Configuration.from_runnable_config读取
#         "thread_id": "local-test-01",
#         "search_api": "tavily",
#         "max_researcher_iterations": 6,
#         "model": "deepseek:deepseek-chat",
#         "mcp_config": {"url": "http://xxx", "tools": []},
#
#         # ========== 【动态运行时参数】和MCP鉴权相关（你刚看的代码）
#         "x-supabase-access-token": "sb_xxxx",  # supabase登录凭证
#         "thread_id": "test-thread-final",      # 对话线程ID（checkpointer记忆依靠这个）
#     },
#     "metadata": {
#         "owner": "user_123"  # 当前操作用户ID！【重点】用来隔离token存储
#     }
# }