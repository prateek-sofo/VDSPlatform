"""
LLM Client — abstraction over OpenAI and Anthropic.
Supports: chat completion, streaming, function/tool calling, JSON mode.
"""
import json
from typing import Optional, AsyncGenerator
import structlog

from app.core.config import settings

log = structlog.get_logger()


class LLMClient:
    """Unified client for OpenAI and Anthropic APIs."""

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        self.provider = provider or settings.DEFAULT_LLM_PROVIDER
        self.model = model or settings.DEFAULT_LLM_MODEL

    async def chat(
        self,
        messages: list[dict],
        system_prompt: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        json_mode: bool = False,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> str:
        """Send a chat completion request and return the text response."""
        if self.provider == "openai":
            return await self._openai_chat(messages, system_prompt, tools, json_mode, temperature, max_tokens)
        elif self.provider == "anthropic":
            return await self._anthropic_chat(messages, system_prompt, tools, json_mode, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    async def _openai_chat(
        self, messages, system_prompt, tools, json_mode, temperature, max_tokens
    ) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        kwargs = dict(
            model=self.model,
            messages=all_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    async def _anthropic_chat(
        self, messages, system_prompt, tools, json_mode, temperature, max_tokens
    ) -> str:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

        kwargs = dict(
            model=self.model if "claude" in self.model else "claude-3-5-sonnet-20241022",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        if system_prompt:
            kwargs["system"] = system_prompt
        if tools:
            kwargs["tools"] = tools

        response = await client.messages.create(**kwargs)
        return response.content[0].text if response.content else ""

    async def json_chat(self, messages: list[dict], system_prompt: str, **kwargs) -> dict:
        """Request a JSON response and parse it."""
        raw = await self.chat(messages, system_prompt=system_prompt, json_mode=True, **kwargs)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Fallback: find JSON block in text
            import re
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            log.warning("llm.json_parse_failed", raw=raw[:200])
            return {"raw": raw}
