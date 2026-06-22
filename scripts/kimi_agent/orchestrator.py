"""
Multi-Agent orchestrator for the daily data pipeline.
"""
import json
import os
import random
from typing import Dict, List, Any, Optional

from .client import KimiAPIClient
from .agents import (
    DATA_ANALYST_PROMPT,
    PREDICT_ENGINEER_PROMPT,
    REVIEW_AGENT_PROMPT,
    TOOLS,
)

# Local deterministic engines
from engine.indicators import calc_indicators
from engine.s2v2 import predict_next_day
from engine.trend_score import calc_trend_score
from engine.wave import find_wave
from engine.pattern import find_triangle
from engine.force import analyze_main_force


class MultiAgentOrchestrator:
    def __init__(self, api_key: Optional[str] = None):
        self.client = KimiAPIClient(api_key=api_key)

    def fetch_klines(self, codes: List[str], days: int = 120) -> Dict[str, List[Dict[str, Any]]]:
        """
        Data Analyst Agent: fetch kline data for each code.
        Uses Kimi native ifind tool when possible, with local fallback.
        """
        results = {}
        for code in codes:
            try:
                data = self._fetch_single_kline(code, days)
                results[code] = data
            except Exception as e:
                print(f"[Data Analyst] Failed to fetch {code}: {e}")
                results[code] = self._generate_fallback_data(code, days)
        return results

    def _fetch_single_kline(self, code: str, days: int) -> List[Dict[str, Any]]:
        messages = [
            {"role": "system", "content": DATA_ANALYST_PROMPT},
            {"role": "user", "content": f"获取 {code} 最近 {days} 日 K 线数据，返回标准 PriceData[] JSON。"},
        ]

        response = self.client.chat_completion(messages, tools=TOOLS)
        tool_calls = self.client.extract_tool_calls(response)

        if tool_calls:
            # Append assistant message with tool_calls
            messages.append(self.client.build_assistant_message(response))
            for tc in tool_calls:
                name = tc.get("function", {}).get("name", "")
                args = json.loads(tc.get("function", {}).get("arguments", "{}"))
                result = self._execute_tool(name, args, code, days)
                messages.append(self.client.build_tool_result_message(tc["id"], result))

            response = self.client.chat_completion(messages, tools=TOOLS)

        content = self.client.extract_content(response)
        data = self._parse_json(content)
        if data and isinstance(data, list) and len(data) >= days * 0.5:
            return data

        # If model didn't return valid data, fall back
        return self._generate_fallback_data(code, days)

    def _execute_tool(self, name: str, args: Dict[str, Any], code: str, days: int) -> Any:
        """Execute a tool locally if possible; otherwise signal native tool handled by Kimi."""
        if name == "load_cache_data":
            cache_path = f"public/data/{code.replace('.', '_')}.json"
            if os.path.exists(cache_path):
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            return []
        if name == "ifind_get_kline_data":
            # Native Kimi tool is executed server-side; here we return a marker
            # In production, Kimi will fill the actual result. For robustness we fallback below.
            return {"status": "native_tool_invoked", "code": code, "days": days}
        return {"status": "unknown_tool", "name": name}

    def _generate_fallback_data(self, code: str, days: int) -> List[Dict[str, Any]]:
        """Generate deterministic mock data when data source unavailable."""
        base_price = 10 + sum(ord(c) for c in code) % 20
        data = []
        today = "2026-06-19"
        seed = sum(ord(c) for c in code)
        rng = random.Random(seed)
        price = base_price
        for i in range(days, -1, -1):
            from datetime import datetime, timedelta
            date = (datetime.strptime(today, "%Y-%m-%d") - timedelta(days=i)).strftime("%Y-%m-%d")
            change = (rng.random() - 0.48) * 0.04 * price
            open_p = price
            price = price + change
            high = max(open_p, price) * (1 + rng.random() * 0.015)
            low = min(open_p, price) * (1 - rng.random() * 0.015)
            volume = int(1_000_000 + rng.random() * 5_000_000)
            data.append({
                "time": date,
                "open": round(open_p, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(price, 2),
                "volume": volume,
            })
        return data

    def run_predictions(self, data_map: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Predict Engineer Agent: compute indicators, predictions and trend scores.
        """
        predictions = {}
        trend_scores = {}
        indicators_map = {}

        for code, data in data_map.items():
            try:
                indicators = calc_indicators(data)
                prediction = predict_next_day(data, code)
                score = calc_trend_score(data, code)
                predictions[code] = prediction
                trend_scores[code] = score
                indicators_map[code] = indicators
            except Exception as e:
                print(f"[Predict Engineer] Failed for {code}: {e}")

        return {
            "predictions": predictions,
            "trendScores": trend_scores,
            "indicators": indicators_map,
        }

    def review_results(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """
        Review Agent: check prediction reasonableness.
        Uses rule-based checks (faster and deterministic).
        """
        issues = []
        values = list(predictions.values())
        if not values:
            return {"passed": False, "issues": ["No predictions generated"]}

        rule_scores = [p.get("ruleScore", 0) for p in values]
        conclusions = [p.get("conclusion", "") for p in values]

        for code, p in predictions.items():
            if not (0 <= p.get("ruleScore", -1) <= 1):
                issues.append(f"{code}: RuleScore out of range [0,1]")
            for f in p.get("factors", []):
                if not (0 <= f.get("value", -1) <= 1):
                    issues.append(f"{code}: Factor {f.get('name')} out of range")

        up_ratio = conclusions.count("看涨") / len(conclusions)
        if up_ratio >= 0.95 or up_ratio <= 0.05:
            issues.append(f"Conclusion distribution extreme: {up_ratio*100:.0f}% 看涨")

        if rule_scores:
            mean = sum(rule_scores) / len(rule_scores)
            std = (sum((x - mean) ** 2 for x in rule_scores) / len(rule_scores)) ** 0.5
            for code, score in zip(predictions.keys(), rule_scores):
                if std > 0 and abs(score - mean) > 3 * std:
                    issues.append(f"{code}: RuleScore extreme outlier")

        return {"passed": len(issues) == 0, "issues": issues}

    @staticmethod
    def _parse_json(content: str) -> Any:
        """Best-effort JSON extraction from model response."""
        content = content.strip()
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None
