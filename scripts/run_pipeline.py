"""
Daily data pipeline entry point.

Stages:
  fetch       - fetch kline data via Data Analyst Agent
  predict     - run Python engine for indicators/predictions/scores
  review      - Review Agent quality gate
  generate    - generate JSON + TS files
  commit      - git commit and push (CI mode)
  all         - run full pipeline
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from typing import List, Dict, Any

# Ensure project root on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from kimi_agent.orchestrator import MultiAgentOrchestrator
from generate_files import (
    save_kline_json,
    generate_predictions_ts,
    generate_trend_scores_ts,
    generate_history_ts,
)

DEFAULT_STOCKS: List[Dict[str, str]] = [
    {"code": "600596", "name": "新安股份", "sector": "有机硅/农药"},
    {"code": "603993", "name": "洛阳钼业", "sector": "铜/钴"},
    {"code": "601899", "name": "紫金矿业", "sector": "金/铜"},
    {"code": "000878", "name": "云南铜业", "sector": "铜"},
    {"code": "601168", "name": "西部矿业", "sector": "铜/锌"},
    {"code": "600219", "name": "南山铝业", "sector": "铝"},
    {"code": "002532", "name": "天山铝业", "sector": "铝"},
    {"code": "601600", "name": "中国铝业", "sector": "铝/综合"},
]

DEFAULT_INDICES: List[Dict[str, str]] = [
    {"code": "000001.SH", "name": "上证指数", "type": "market"},
    {"code": "881168", "name": "工业金属", "type": "sector"},
]


def parse_args():
    parser = argparse.ArgumentParser(description="Multi-Agent-Stock-Analysis daily data pipeline")
    parser.add_argument(
        "--stage",
        choices=["fetch", "predict", "review", "generate", "commit", "all"],
        default="all",
        help="Pipeline stage to run",
    )
    parser.add_argument("--ci", action="store_true", help="Run in CI mode (auto commit/push)")
    return parser.parse_args()


def run_pipeline(stage: str, ci: bool = False) -> bool:
    """Run the requested pipeline stage(s). Returns True on success."""
    stock_codes = [s["code"] for s in DEFAULT_STOCKS]
    index_codes = [i["code"] for i in DEFAULT_INDICES]
    all_codes = stock_codes + index_codes

    api_key = os.environ.get("KIMI_API_KEY")
    orchestrator = MultiAgentOrchestrator(api_key=api_key)

    data_map: Dict[str, List[Dict[str, Any]]] = {}
    predictions: Dict[str, Any] = {}
    trend_scores: Dict[str, Any] = {}

    if stage in ("fetch", "all"):
        print("\n[Pipeline] Stage: fetch")
        data_map = orchestrator.fetch_klines(all_codes, days=120)
        save_kline_json(data_map)
    else:
        # Load existing data
        for code in all_codes:
            file_name = code.replace(".", "_")
            path = os.path.join("public", "data", f"{file_name}.json")
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    data_map[code] = json.load(f)

    if stage in ("predict", "all"):
        print("\n[Pipeline] Stage: predict")
        if not data_map:
            print("[Pipeline] No data available, run --stage fetch first")
            return False
        stock_data = {code: data_map[code] for code in stock_codes if code in data_map}
        result = orchestrator.run_predictions(stock_data)
        predictions = result["predictions"]
        trend_scores = result["trendScores"]

    if stage in ("review", "all"):
        print("\n[Pipeline] Stage: review")
        review = orchestrator.review_results(predictions)
        print(f"[Review] passed={review['passed']}, issues={review['issues']}")
        if not review["passed"]:
            print("[Pipeline] Review failed, aborting")
            return False

    if stage in ("generate", "all"):
        print("\n[Pipeline] Stage: generate")
        # Recompute predictions if not already done
        if not predictions and stock_codes:
            stock_data = {code: data_map[code] for code in stock_codes if code in data_map}
            result = orchestrator.run_predictions(stock_data)
            predictions = result["predictions"]
            trend_scores = result["trendScores"]

        generate_predictions_ts(predictions)
        generate_trend_scores_ts(trend_scores)
        # TODO: append today's prediction to history and verify yesterday's
        generate_history_ts([])

    if stage == "commit" or (stage == "all" and ci):
        print("\n[Pipeline] Stage: commit")
        return git_commit_and_push()

    return True


def git_commit_and_push() -> bool:
    """Commit generated files and push to trigger deploy."""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        subprocess.run(["git", "config", "user.name", "kimi-bot[agent]"], check=True)
        subprocess.run(["git", "config", "user.email", "kimi-bot@users.noreply.github.com"], check=True)
        subprocess.run(["git", "add", "public/data/", "src/constants/"], check=True)
        result = subprocess.run(
            ["git", "diff", "--cached", "--quiet"],
            capture_output=True,
        )
        if result.returncode == 0:
            print("[Git] No changes to commit")
            return True
        subprocess.run(
            ["git", "commit", "-m", f"📊 Daily: {today} [Kimi Agent]"],
            check=True,
        )
        subprocess.run(["git", "push"], check=True)
        print("[Git] Committed and pushed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[Git] Error: {e}")
        return False


def main():
    args = parse_args()
    success = run_pipeline(args.stage, ci=args.ci)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
