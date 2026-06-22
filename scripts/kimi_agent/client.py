"""
Kimi 2.6 API client wrapper (OpenAI-compatible format).
"""
import os
import json
import time
from typing import Dict, List, Any, Optional
import requests


class KimiAPIClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.kimi.com/coding/v1", model: str = "kimi-for-coding"):
        self.api_key = api_key or os.environ.get("KIMI_API_KEY")
        if not self.api_key:
            raise ValueError("KIMI_API_KEY is required")
        self.base_url = base_url
        self.model = model

    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: str = "auto",
        temperature: float = 0.2,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Call Kimi chat.completions API with retry."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice

        for attempt in range(max_retries):
            try:
                resp = requests.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=120,
                )
                if resp.status_code == 429:
                    time.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                return resp.json()
            except requests.RequestException as e:
                if attempt == max_retries - 1:
                    raise RuntimeError(f"Kimi API request failed after {max_retries} retries: {e}")
                time.sleep(2 ** attempt)

        raise RuntimeError("Unexpected exit from chat_completion retry loop")

    @staticmethod
    def extract_content(response: Dict[str, Any]) -> str:
        """Extract text content from response."""
        choices = response.get("choices", [])
        if not choices:
            return ""
        message = choices[0].get("message", {})
        return message.get("content", "") or ""

    @staticmethod
    def extract_tool_calls(response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract tool calls from response."""
        choices = response.get("choices", [])
        if not choices:
            return []
        message = choices[0].get("message", {})
        return message.get("tool_calls", []) or []

    @staticmethod
    def build_tool_result_message(tool_call_id: str, result: Any) -> Dict[str, Any]:
        """Build a tool result message."""
        content = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False, default=str)
        return {
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": content,
        }

    @staticmethod
    def build_assistant_message(response: Dict[str, Any]) -> Dict[str, Any]:
        """Build an assistant message from response for conversation continuity."""
        choices = response.get("choices", [])
        if not choices:
            return {"role": "assistant", "content": ""}
        message = choices[0].get("message", {})
        return {
            "role": "assistant",
            "content": message.get("content", "") or "",
            "tool_calls": message.get("tool_calls", []),
        }
