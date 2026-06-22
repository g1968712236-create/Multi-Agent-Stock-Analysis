"""
Wave theory detection engine.
"""
import numpy as np
from typing import Dict, List, Any


def find_wave(kline_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detect local extrema and label wave structure.
    """
    closes = np.array([float(d['close']) for d in kline_data])
    dates = [d['time'] for d in kline_data]

    if len(closes) < 10:
        return {'points': [], 'pattern': '数据不足', 'confidence': 0}

    peaks = []
    valleys = []
    for i in range(2, len(closes) - 2):
        if closes[i] > closes[i - 1] and closes[i] > closes[i - 2] and closes[i] > closes[i + 1] and closes[i] > closes[i + 2]:
            peaks.append({'index': i, 'date': dates[i], 'price': closes[i], 'type': 'peak'})
        if closes[i] < closes[i - 1] and closes[i] < closes[i - 2] and closes[i] < closes[i + 1] and closes[i] < closes[i + 2]:
            valleys.append({'index': i, 'date': dates[i], 'price': closes[i], 'type': 'valley'})

    points = sorted(peaks + valleys, key=lambda x: x['index'])

    if len(points) >= 5:
        # Simple Elliott-like pattern detection
        last_five = points[-5:]
        if last_five[0]['type'] == 'valley' and last_five[-1]['type'] == 'peak':
            higher_highs = last_five[2]['price'] > last_five[0]['price']
            higher_lows = last_five[1]['price'] < last_five[3]['price']
            if higher_highs and higher_lows:
                pattern = '上升推动浪'
                confidence = 0.7
            else:
                pattern = '调整浪'
                confidence = 0.5
        else:
            pattern = '未识别'
            confidence = 0.3
    else:
        pattern = '浪型不足'
        confidence = 0.2

    return {'points': points[-8:], 'pattern': pattern, 'confidence': confidence}
