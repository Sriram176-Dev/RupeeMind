import pytest
import pandas as pd
import numpy as np

from src.features.indicators import TechnicalIndicators
from src.features.feature_engineering import FeatureEngineering
from src.features.label_generator import LabelGenerator


@pytest.fixture
def sample_ohlcv_data():
    """Generates synthetic OHLCV data for testing."""
    dates = pd.date_range(start="2024-01-01", periods=100, freq="D")
    np.random.seed(42)

    close = np.linspace(100, 150, 100) + np.random.normal(0, 2, 100)
    high = close + np.random.uniform(1, 5, 100)
    low = close - np.random.uniform(1, 5, 100)
    open_p = low + np.random.uniform(0.5, 3, 100)
    volume = np.random.randint(1000, 50000, 100)

    df = pd.DataFrame({
        "Date": dates,
        "Open": open_p,
        "High": high,
        "Low": low,
        "Close": close,
        "Volume": volume
    })
    return df


def test_technical_indicators_generation(sample_ohlcv_data):
    indicator = TechnicalIndicators()
    df_ind = indicator.generate(sample_ohlcv_data)

    expected_cols = [
        "RSI", "EMA20", "EMA50", "SMA20", "SMA50",
        "MACD", "MACD_SIGNAL", "MACD_HIST",
        "BB_HIGH", "BB_LOW", "ATR", "ADX", "OBV",
        "DAILY_RETURN", "VOLUME_CHANGE"
    ]

    for col in expected_cols:
        assert col in df_ind.columns, f"Missing indicator column: {col}"

    assert not df_ind.isnull().values.any(), "Indicators output contains NaN values"


def test_feature_engineering_generation(sample_ohlcv_data):
    indicator = TechnicalIndicators()
    df_ind = indicator.generate(sample_ohlcv_data)

    engineer = FeatureEngineering()
    df_feat = engineer.generate(df_ind)

    expected_cols = [
        "PRICE_CHANGE", "PRICE_CHANGE_PERCENT", "DAILY_RANGE",
        "HIGH_LOW_RATIO", "OPEN_CLOSE_RATIO", "PREVIOUS_CLOSE",
        "PREVIOUS_VOLUME", "ROLLING_MEAN_5", "VOLATILITY", "PREVIOUS_RSI"
    ]

    for col in expected_cols:
        assert col in df_feat.columns, f"Missing engineered feature column: {col}"

    assert not df_feat.isnull().values.any(), "Feature engineering output contains NaN values"


def test_label_generator(sample_ohlcv_data):
    label_gen = LabelGenerator(future_days=5, buy_threshold=2.0, sell_threshold=-2.0)
    df_labeled = label_gen.generate(sample_ohlcv_data)

    assert "LABEL" in df_labeled.columns
    assert set(df_labeled["LABEL"].unique()).issubset({"BUY", "SELL", "HOLD"})
    assert not df_labeled["LABEL"].isnull().any()
