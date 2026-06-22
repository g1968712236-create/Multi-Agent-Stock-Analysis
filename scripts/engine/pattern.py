"""
Pattern detection engine: converging triangle.
"""
import numpy as np
from typing import Dict, List, Any


def find_triangle(kline_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detect converging triangle patterns via linear regression on highs/lows.
    """
    if len(kline_data) < 30:
        return {
            'upperLine': {'slope': 0, 'intercept': 0},
            'lowerLine': {'slope': 0, 'intercept': 0},
            'isConverging': False,
            'convergenceRate': 0,
            'apexIndex': 0,
            'type': 'none',
        }

    highs = np.array([float(d['high']) for d in kline_data[-60:]])
    lows = np.array([float(d['low']) for d in kline_data[-60:]])
    x = np.arange(len(highs))

    upper_slope, upper_intercept = np.polyfit(x, highs, 1)
    lower_slope, lower_intercept = np.polyfit(x, lows, 1)

    is_converging = upper_slope < 0 and lower_slope > 0
    convergence_rate = abs(upper_slope - lower_slope)

    if is_converging:
        if abs(upper_slope) > abs(lower_slope):
            tri_type = '下降三角形'
        elif abs(lower_slope) > abs(upper_slope):
            tri_type = '上升三角形'
        else:
            tri_type = '对称三角形'
    else:
        tri_type = 'none'

    apex_index = int((lower_intercept - upper_intercept) / (upper_slope - lower_slope + 1e-9))

    return {
        'upperLine': {'slope': float(upper_slope), 'intercept': float(upper_intercept)},
        'lowerLine': {'slope': float(lower_slope), 'intercept': float(lower_intercept)},
        'isConverging': bool(is_converging),
        'convergenceRate': float(convergence_rate),
        'apexIndex': int(apex_index),
        'type': tri_type if is_converging else 'none',
    }
