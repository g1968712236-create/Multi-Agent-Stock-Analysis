"""
S2_v2 prediction engine: 10-factor linear weighting + dynamic threshold.
"""
import numpy as np
from typing import Dict, List, Any

FACTOR_WEIGHTS = {
    'trend': 0.120,
    'rsi': 0.104,
    'clv': 0.103,
    'volatility': 0.109,
    'bollinger': 0.097,
    'adx': 0.098,
    'macd': 0.093,
    'volume': 0.090,
    'kdj': 0.089,
    'ma60': 0.095,
}


def predict_next_day(kline_data: List[Dict[str, Any]], stock_code: str) -> Dict[str, Any]:
    """Run S2_v2 rule engine prediction for the next trading day."""
    closes = np.array([float(d['close']) for d in kline_data])
    highs = np.array([float(d['high']) for d in kline_data])
    lows = np.array([float(d['low']) for d in kline_data])
    volumes = np.array([float(d['volume']) for d in kline_data])

    if len(closes) < 60:
        raise ValueError("Need at least 60 days of data for prediction")

    factors = {}

    # Trend: price vs MA5 vs MA20
    ma5 = np.mean(closes[-5:])
    ma20 = np.mean(closes[-20:])
    factors['trend'] = _normalize((closes[-1] - ma20) / ma20 + 0.5 * (ma5 - ma20) / ma20)

    # RSI
    rsi = _rsi(closes, 14)
    factors['rsi'] = _normalize((rsi - 30) / 40)  # favor mid-range

    # CLV
    clv = ((closes[-1] - lows[-1]) - (highs[-1] - closes[-1])) / (highs[-1] - lows[-1] + 1e-9)
    factors['clv'] = _normalize(clv + volumes[-1] / np.mean(volumes[-20:]) * 0.2)

    # Volatility: inverse of 20-day annualized volatility
    ret = np.diff(closes[-21:]) / closes[-21:-1]
    vol = np.std(ret) * np.sqrt(252) * 100
    factors['volatility'] = _normalize(1.0 / (1.0 + vol / 30.0))

    # Bollinger position
    ma20_line = np.mean(closes[-20:])
    std20 = np.std(closes[-20:])
    bb_pos = (closes[-1] - (ma20_line - 2 * std20)) / (4 * std20 + 1e-9)
    factors['bollinger'] = _normalize(bb_pos)

    # ADX (approximated via RSI change momentum)
    adx = _adx(highs, lows, closes, 14)
    factors['adx'] = _normalize(adx / 100.0)

    # MACD
    macd_hist = _macd_hist(closes)
    factors['macd'] = _normalize(macd_hist / (np.std(closes[-20:]) + 1e-9) + 0.5)

    # Volume ratio
    vol_ratio = volumes[-1] / np.mean(volumes[-20:])
    factors['volume'] = _normalize((vol_ratio - 0.5) / 2.0)

    # KDJ J
    k, d, j = _kdj(closes, highs, lows)
    factors['kdj'] = _normalize((j - 20) / 60.0)

    # MA60
    ma60 = np.mean(closes[-60:])
    factors['ma60'] = _normalize((closes[-1] - ma60) / ma60 * 5.0)

    rule_score = sum(factors[k] * FACTOR_WEIGHTS[k] for k in FACTOR_WEIGHTS)
    threshold = 0.46 if vol > 35 else 0.40
    conclusion = '看涨' if rule_score >= threshold else '看跌'
    confidence = '高' if abs(rule_score - threshold) > 0.05 else '中等'

    return {
        'code': stock_code,
        'ruleScore': round(float(rule_score), 4),
        'threshold': threshold,
        'conclusion': conclusion,
        'confidence': confidence,
        'upProb': round(float(rule_score), 4) if conclusion == '看涨' else round(float(1 - rule_score), 4),
        'downProb': round(float(rule_score), 4) if conclusion == '看跌' else round(float(1 - rule_score), 4),
        'neutralProb': 0,
        'factors': [
            {'name': name, 'weight': weight, 'value': round(float(factors[name]), 4)}
            for name, weight in FACTOR_WEIGHTS.items()
        ],
    }


def _normalize(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))


def _rsi(prices: np.ndarray, period: int = 14) -> float:
    delta = np.diff(prices)
    gains = np.where(delta > 0, delta, 0)
    losses = np.where(delta < 0, -delta, 0)
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def _macd_hist(prices: np.ndarray) -> float:
    ema12 = _ema(prices, 12)
    ema26 = _ema(prices, 26)
    macd = ema12 - ema26
    signal = _ema_single(macd, 9)
    return macd[-1] - signal


def _ema(prices: np.ndarray, span: int) -> np.ndarray:
    alpha = 2.0 / (span + 1)
    ema = np.zeros_like(prices)
    ema[0] = prices[0]
    for i in range(1, len(prices)):
        ema[i] = alpha * prices[i] + (1 - alpha) * ema[i - 1]
    return ema


def _ema_single(series: np.ndarray, span: int) -> float:
    alpha = 2.0 / (span + 1)
    result = series[0]
    for i in range(1, len(series)):
        result = alpha * series[i] + (1 - alpha) * result
    return result


def _adx(highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
    if len(highs) < period + 1:
        return 25.0
    high_diff = np.diff(highs)
    low_diff = -np.diff(lows)
    plus_dm = np.where((high_diff > low_diff) & (high_diff > 0), high_diff, 0)
    minus_dm = np.where((low_diff > high_diff) & (low_diff > 0), low_diff, 0)
    tr1 = highs[1:] - lows[1:]
    tr2 = np.abs(highs[1:] - closes[:-1])
    tr3 = np.abs(lows[1:] - closes[:-1])
    tr = np.maximum(np.maximum(tr1, tr2), tr3)
    atr = np.mean(tr[-period:])
    if atr == 0:
        return 25.0
    plus_di = 100 * np.mean(plus_dm[-period:]) / atr
    minus_di = 100 * np.mean(minus_dm[-period:]) / atr
    dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di + 1e-9)
    return dx


def _kdj(closes: np.ndarray, highs: np.ndarray, lows: np.ndarray, n: int = 9) -> tuple:
    if len(closes) < n:
        return 50.0, 50.0, 50.0
    low_n = np.min(lows[-n:])
    high_n = np.max(highs[-n:])
    range_n = high_n - low_n
    if range_n == 0:
        rsv = 50.0
    else:
        rsv = (closes[-1] - low_n) / range_n * 100
    # Smooth approximations
    k = rsv
    d = rsv
    j = 3 * k - 2 * d
    return k, d, j
