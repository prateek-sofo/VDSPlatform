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

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None, agent_id: Optional[str] = None):
        if agent_id and getattr(settings, "MODEL_ROUTING", {}).get(agent_id):
            route = settings.MODEL_ROUTING.get(agent_id, {})
            self.provider = provider or route.get("provider", settings.DEFAULT_LLM_PROVIDER)
            self.model = model or route.get("model", settings.DEFAULT_LLM_MODEL)
        else:
            self.provider = provider or settings.DEFAULT_LLM_PROVIDER
            self.model = model or settings.DEFAULT_LLM_MODEL

    async def chat(
        self,
        messages: list[dict],
        system_prompt: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        json_mode: bool = False,
        response_schema: Optional[type] = None,
        temperature: float = 0.2,
        max_tokens: int = 8192,
    ) -> str:
        """Send a chat completion request and return the text response."""
        if self.provider == "openai":
            return await self._openai_chat(messages, system_prompt, tools, json_mode, response_schema, temperature, max_tokens)
        elif self.provider == "anthropic":
            return await self._anthropic_chat(messages, system_prompt, tools, json_mode, temperature, max_tokens)
        elif self.provider == "gemini":
            return await self._gemini_chat(messages, system_prompt, tools, json_mode, response_schema, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    async def _openai_chat(
        self, messages, system_prompt, tools, json_mode, response_schema, temperature, max_tokens
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
        if response_schema:
            kwargs["response_format"] = {
                "type": "json_schema", 
                "json_schema": {
                    "name": "response",
                    "schema": response_schema.model_json_schema()
                }
            }
        elif json_mode:
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

    async def _gemini_chat(
        self, messages, system_prompt, tools, json_mode, response_schema, temperature, max_tokens
    ) -> str:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])])
            )

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        if system_prompt:
            config.system_instruction = system_prompt
        
        if response_schema:
            config.response_mime_type = "application/json"
            schema_dict = response_schema.model_json_schema()
            
            def remove_additional_properties(d):
                if isinstance(d, dict):
                    d.pop("additionalProperties", None)
                    for k, v in d.items():
                        remove_additional_properties(v)
                elif isinstance(d, list):
                    for item in d:
                        remove_additional_properties(item)
                        
            remove_additional_properties(schema_dict)
            config.response_schema = schema_dict
        elif json_mode:
            config.response_mime_type = "application/json"

        response = await client.aio.models.generate_content(
            model=self.model,
            contents=contents,
            config=config
        )
        return response.text

    async def json_chat(self, messages: list[dict], system_prompt: str, response_schema: Optional[type] = None, **kwargs) -> dict:
        """Request a JSON response and parse it."""
        raw = await self.chat(messages, system_prompt=system_prompt, json_mode=True, response_schema=response_schema, **kwargs)
        try:
            # Aggressively strip markdown code block syntax
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback: find JSON block in text
            import re
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            log.warning("llm.json_parse_failed", raw=raw[:200])
            return {"raw": raw}
