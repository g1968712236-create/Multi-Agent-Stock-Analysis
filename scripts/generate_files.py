"""
File generators for JSON data and TypeScript constants.
"""
import json
import os
from typing import Dict, List, Any

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def save_kline_json(data_map: Dict[str, List[Dict[str, Any]]]) -> None:
    """Save kline data to public/data/{code}.json."""
    data_dir = os.path.join(PROJECT_ROOT, "public", "data")
    os.makedirs(data_dir, exist_ok=True)
    for code, data in data_map.items():
        file_name = code.replace(".", "_")
        path = os.path.join(data_dir, f"{file_name}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[FileGen] Saved {path}")


def generate_predictions_ts(predictions: Dict[str, Any]) -> None:
    """Generate src/constants/predictions.ts."""
    const_dir = os.path.join(PROJECT_ROOT, "src", "constants")
    os.makedirs(const_dir, exist_ok=True)
    path = os.path.join(const_dir, "predictions.ts")
    content = f"""import type {{ Prediction }} from '../types'

export const S2V2_PREDICTIONS: Record<string, Prediction> = {json.dumps(predictions, ensure_ascii=False, indent=2)}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[FileGen] Saved {path}")


def generate_trend_scores_ts(trend_scores: Dict[str, Any]) -> None:
    """Generate src/constants/trendScores.ts."""
    const_dir = os.path.join(PROJECT_ROOT, "src", "constants")
    os.makedirs(const_dir, exist_ok=True)
    path = os.path.join(const_dir, "trendScores.ts")
    content = f"""import type {{ TrendScore }} from '../types'

export const TREND_SCORES: Record<string, TrendScore> = {json.dumps(trend_scores, ensure_ascii=False, indent=2)}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[FileGen] Saved {path}")


def generate_history_ts(records: List[Dict[str, Any]]) -> None:
    """Generate src/constants/history.ts."""
    const_dir = os.path.join(PROJECT_ROOT, "src", "constants")
    os.makedirs(const_dir, exist_ok=True)
    path = os.path.join(const_dir, "history.ts")
    content = f"""import type {{ PredictionRecord }} from '../types'

export const HISTORY_DATA: PredictionRecord[] = {json.dumps(records, ensure_ascii=False, indent=2)}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[FileGen] Saved {path}")
