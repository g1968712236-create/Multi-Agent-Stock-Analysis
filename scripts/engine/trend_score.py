"""
Six-dimension trend scoring engine.
"""
import numpy as np
from typing import Dict, List, Any


def calc_trend_score(kline_data: List[Dict[str, Any]], code: str = '') -> Dict[str, Any]:
    """
    Compute the six-dimension trend score.
    Total = wave*25% + trendline*20% + adx*15% + macd*15% + ma_slope*15% + price_ma*10%
    """
    closes = np.array([float(d['close']) for d in kline_data])
    highs = np.array([float(d['high']) for d in kline_data])
    lows = np.array([float(d['low']) for d in kline_data])

    if len(closes) < 60:
        raise ValueError("Need at least 60 days for trend score")

    # Wave structure score (25%)
    wave_score = _wave_score(closes, highs, lows)

    # Trend line slope score (20%)
    trendline_score = _trendline_score(highs, lows)

    # ADX strength (15%)
    adx_score = _adx_score(closes, highs, lows)

    # MACD score (15%)
    macd_score = _macd_score(closes)

    # MA60 slope (15%)
    ma_slope_score = _ma_slope_score(closes)

    # Price vs MA (10%)
    price_ma_score = _price_ma_score(closes)

    total = (
        wave_score * 0.25
        + trendline_score * 0.20
        + adx_score * 0.15
        + macd_score * 0.15
        + ma_slope_score * 0.15
        + price_ma_score * 0.10
    )

    total = int(np.clip(total, 0, 100))

    label = '强势多头' if total >= 70 else '偏多' if total >= 55 else '震荡' if total >= 45 else '偏空' if total >= 30 else '弱势空头'

    return {
        'code': code,
        'total': total,
        'wave': int(wave_score),
        'trendline': int(trendline_score),
        'adx': int(adx_score),
        'macd': int(macd_score),
        'maSlope': int(ma_slope_score),
        'priceMa': int(price_ma_score),
        'label': label,
    }


def _wave_score(closes, highs, lows):
    # Simple implementation: trend aligned with higher highs / higher lows
    if len(closes) < 40:
        return 50
    highs_recent = highs[-20:]
    lows_recent = lows[-20:]
    hh = highs_recent[-1] > np.mean(highs_recent[:10])
    hl = lows_recent[-1] > np.mean(lows_recent[:10])
    if hh and hl:
        return 80
    if not hh and not hl:
        return 25
    return 55


def _trendline_score(highs, lows):
    if len(highs) < 30:
        return 50
    x = np.arange(30)
    high_slope = np.polyfit(x, highs[-30:], 1)[0]
    low_slope = np.polyfit(x, lows[-30:], 1)[0]
    combined = (high_slope + low_slope) / 2
    normalized = combined / (np.mean(highs[-30:]) * 0.005 + 1e-9)
    return int(np.clip(50 + normalized * 30, 0, 100))


def _adx_score(closes, highs, lows):
    if len(closes) < 15:
        return 50
    high_diff = np.diff(highs)
    low_diff = -np.diff(lows)
    plus_dm = np.where((high_diff > low_diff) & (high_diff > 0), high_diff, 0)
    minus_dm = np.where((low_diff > high_diff) & (low_diff > 0), low_diff, 0)
    tr1 = highs[1:] - lows[1:]
    tr2 = np.abs(highs[1:] - closes[:-1])
    tr3 = np.abs(lows[1:] - closes[:-1])
    tr = np.maximum(np.maximum(tr1, tr2), tr3)
    atr = np.mean(tr[-14:])
    if atr == 0:
        return 50
    plus_di = 100 * np.mean(plus_dm[-14:]) / atr
    minus_di = 100 * np.mean(minus_dm[-14:]) / atr
    dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di + 1e-9)
    return int(np.clip(dx, 0, 100))


def _macd_score(closes):
    if len(closes) < 35:
        return 50
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd = ema12 - ema26
    signal = _ema(macd, 9)
    hist = macd - signal
    score = 50 + hist[-1] / (np.std(closes[-20:]) + 1e-9) * 20
    return int(np.clip(score, 0, 100))


def _ma_slope_score(closes):
    if len(closes) < 80:
        return 50
    ma60_now = np.mean(closes[-60:])
    ma60_prev = np.mean(closes[-80:-20])
    slope = (ma60_now - ma60_prev) / ma60_prev * 100
    return int(np.clip(50 + slope * 10, 0, 100))


def _price_ma_score(closes):
    if len(closes) < 120:
        return 50
    ma60 = np.mean(closes[-60:])
    ma120 = np.mean(closes[-120:])
    price = closes[-1]
    score = 50
    if price > ma60:
        score += 20
    if price > ma120:
        score += 15
    if ma60 > ma120:
        score += 15
    return int(np.clip(score, 0, 100))


def _ema(prices, span):
    alpha = 2.0 / (span + 1)
    ema = np.zeros_like(prices, dtype=float)
    ema[0] = prices[0]
    for i in range(1, len(prices)):
        ema[i] = alpha * prices[i] + (1 - alpha) * ema[i - 1]
    return ema
