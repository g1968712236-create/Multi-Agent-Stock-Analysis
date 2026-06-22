"""
Technical indicators calculation engine.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any


def calc_indicators(kline_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute 12 technical indicators from OHLCV daily kline data.
    Returns the latest indicator values.
    """
    if len(kline_data) < 60:
        raise ValueError(f"Need at least 60 days of data, got {len(kline_data)}")

    df = pd.DataFrame(kline_data)
    df['time'] = pd.to_datetime(df['time'])
    df = df.sort_values('time').reset_index(drop=True)
    close = df['close'].astype(float)
    high = df['high'].astype(float)
    low = df['low'].astype(float)
    volume = df['volume'].astype(float)

    # Moving averages
    df['ma5'] = close.rolling(window=5).mean()
    df['ma10'] = close.rolling(window=10).mean()
    df['ma20'] = close.rolling(window=20).mean()
    df['ma60'] = close.rolling(window=60).mean()
    df['ma120'] = close.rolling(window=120).mean()
    df['ma250'] = close.rolling(window=min(250, len(close))).mean()

    # MACD
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df['macd'] = ema12 - ema26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    # RSI
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df['rsi'] = 100 - (100 / (1 + rs))

    # Bollinger Bands
    df['bb_middle'] = close.rolling(window=20).mean()
    bb_std = close.rolling(window=20).std()
    df['bb_upper'] = df['bb_middle'] + 2 * bb_std
    df['bb_lower'] = df['bb_middle'] - 2 * bb_std

    # KDJ
    low_min = low.rolling(window=9).min()
    high_max = high.rolling(window=9).max()
    rsv = (close - low_min) / (high_max - low_min).replace(0, np.nan) * 100
    df['k'] = rsv.ewm(com=2, adjust=False).mean()
    df['d'] = df['k'].ewm(com=2, adjust=False).mean()
    df['j'] = 3 * df['k'] - 2 * df['d']

    # ADX / DI
    plus_dm = high.diff().clip(lower=0)
    minus_dm = -low.diff().clip(upper=0)
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=14).mean()
    df['plus_di'] = 100 * plus_dm.rolling(window=14).mean() / atr.replace(0, np.nan)
    df['minus_di'] = 100 * minus_dm.rolling(window=14).mean() / atr.replace(0, np.nan)
    dx = (df['plus_di'] - df['minus_di']).abs() / (df['plus_di'] + df['minus_di']).replace(0, np.nan) * 100
    df['adx'] = dx.rolling(window=14).mean()

    # Volume MAs
    df['volume_ma5'] = volume.rolling(window=5).mean()
    df['volume_ma20'] = volume.rolling(window=20).mean()

    # Main force (CLV based)
    clv = ((close - low) - (high - close)) / (high - low).replace(0, np.nan)
    df['capital_flow'] = clv * volume
    df['cf5'] = df['capital_flow'].rolling(window=5).sum()
    df['mfs'] = df['capital_flow'].rolling(window=20).sum()

    latest = df.iloc[-1].to_dict()
    return _clean(latest)


def _clean(value):
    if isinstance(value, float):
        if np.isnan(value):
            return None
        return float(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        if np.isnan(value):
            return None
        return float(value)
    return value
