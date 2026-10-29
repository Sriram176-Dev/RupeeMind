from pydantic import BaseModel, Field


class StockFeatures(BaseModel):
    Open: float
    High: float
    Low: float
    Close: float
    Volume: float

    # Core Indicators
    RSI: float
    EMA20: float
    EMA50: float
    SMA20: float
    SMA50: float
    MACD: float
    MACD_SIGNAL: float
    MACD_HIST: float
    BB_HIGH: float = Field(default=105.0)
    BB_LOW: float = Field(default=95.0)
    ATR: float
    ADX: float
    OBV: float

    # Advanced Indicators
    MFI: float = Field(default=50.0)
    STOCH_K: float = Field(default=50.0)
    STOCH_D: float = Field(default=50.0)
    VWAP: float = Field(default=100.0)
    PRICE_VWAP_RATIO: float = Field(default=1.0)
    TENKAN_SEN: float = Field(default=100.0)
    KIJUN_SEN: float = Field(default=100.0)
    SENKOU_SPAN_A: float = Field(default=100.0)
    SENKOU_SPAN_B: float = Field(default=100.0)
    SUPERTREND: float = Field(default=100.0)
    SUPERTREND_SIGNAL: float = Field(default=1.0)

    # Engineered Features
    DAILY_RETURN: float
    VOLUME_CHANGE: float
    PRICE_CHANGE: float
    PRICE_CHANGE_PERCENT: float
    DAILY_RANGE: float
    HIGH_LOW_RATIO: float
    OPEN_CLOSE_RATIO: float
    PREVIOUS_CLOSE: float
    PREVIOUS_VOLUME: float
    ROLLING_MEAN_5: float
    VOLATILITY: float
    PREVIOUS_RSI: float

    # Market Context Features
    VIX_CLOSE: float = Field(default=15.0)
    VIX_CHANGE: float = Field(default=0.0)
    NIFTY50_CLOSE: float = Field(default=18000.0)
    NIFTY50_RETURN: float = Field(default=0.0)
    RELATIVE_STRENGTH: float = Field(default=0.0)

    # Fundamental Metadata Features
    MARKET_CAP: float = Field(default=1e11)
    PE_RATIO: float = Field(default=25.0)
    VOLATILITY_PCT: float = Field(default=2.5)
    SECTOR_CODE: float = Field(default=1.0)
