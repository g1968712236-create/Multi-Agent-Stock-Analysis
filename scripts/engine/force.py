"""
Main force (capital flow) analysis engine.
"""
import numpy as np
from typing import Dict, List, Any


def analyze_main_force(kline_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze main capital force using Close Location Value (CLV) * volume.
    """
    closes = np.array([float(d['close']) for d in kline_data])
    highs = np.array([float(d['high']) for d in kline_data])
    lows = np.array([float(d['low']) for d in kline_data])
    volumes = np.array([float(d['volume']) for d in kline_data])

    clv = ((closes - lows) - (highs - closes)) / (highs - lows + 1e-9)
    capital_flow = clv * volumes

    cf = float(capital_flow[-1])
    cf5 = float(np.sum(capital_flow[-5:]))
    mfs = float(np.sum(capital_flow[-20:]))

    force = abs(mfs)
    if mfs > force * 0.1:
        direction = 'inflow'
    elif mfs < -force * 0.1:
        direction = 'outflow'
    else:
        direction = 'neutral'

    if cf5 > mfs * 0.3:
        trend = 'increasing'
    elif cf5 < -mfs * 0.3:
        trend = 'decreasing'
    else:
        trend = 'stable'

    return {
        'direction': direction,
        'force': float(force),
        'trend': trend,
        'cf': cf,
        'cf5': cf5,
        'mfs': mfs,
    }
