import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from src.models.train_xgboost import XGBoostTrainer
from src.models.predictor import StockPredictor
from src.preprocessing.encoder import TargetEncoder
from src.models.save_model import ModelSaver
from src.api.app import app
from src.utils.constants import SAVED_MODELS_DIR


@pytest.fixture(scope="module", autouse=True)
def setup_saved_model(tmp_path_factory):
    """Ensures a trained model and encoder artifacts exist in saved_models for prediction tests."""
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

    feature_names = [
        "Open", "High", "Low", "Close", "Volume",
        "RSI", "EMA20", "EMA50", "SMA20", "SMA50",
        "MACD", "MACD_SIGNAL", "MACD_HIST",
        "ATR", "ADX", "OBV", "DAILY_RETURN", "VOLUME_CHANGE",
        "PRICE_CHANGE", "PRICE_CHANGE_PERCENT", "DAILY_RANGE",
        "HIGH_LOW_RATIO", "OPEN_CLOSE_RATIO", "PREVIOUS_CLOSE",
        "PREVIOUS_VOLUME", "ROLLING_MEAN_5", "VOLATILITY", "PREVIOUS_RSI"
    ]

    np.random.seed(42)
    X = pd.DataFrame(np.random.randn(100, len(feature_names)), columns=feature_names)
    y_raw = np.random.choice(["BUY", "SELL", "HOLD"], size=100)

    encoder = TargetEncoder()
    y = encoder.fit_transform(y_raw)
    encoder.save("label_encoder.pkl")

    trainer = XGBoostTrainer()
    model = trainer.train(X, y)
    trainer.save(model)

    saver = ModelSaver()
    saver.save_feature_columns(feature_names)


def test_stock_predictor():
    predictor = StockPredictor()
    feature_names = predictor.feature_columns

    df_sample = pd.DataFrame(np.random.randn(1, len(feature_names)), columns=feature_names)
    result = predictor.predict(df_sample)

    assert "prediction" in result
    assert "confidence" in result
    assert result["prediction"] in ["BUY", "SELL", "HOLD"]
    assert isinstance(result["confidence"], float)


def test_api_home_endpoint():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "RupeeMind ML API Running Successfully"


def test_api_predict_endpoint():
    client = TestClient(app)

    payload = {
        "Open": 100.0, "High": 105.0, "Low": 99.0, "Close": 104.0, "Volume": 15000.0,
        "RSI": 55.5, "EMA20": 101.0, "EMA50": 98.0, "SMA20": 100.5, "SMA50": 97.5,
        "MACD": 1.2, "MACD_SIGNAL": 1.0, "MACD_HIST": 0.2,
        "BB_HIGH": 105.0, "BB_LOW": 95.0,
        "ATR": 2.5, "ADX": 22.0, "OBV": 500000.0,
        "DAILY_RETURN": 0.02, "VOLUME_CHANGE": 0.05,
        "PRICE_CHANGE": 4.0, "PRICE_CHANGE_PERCENT": 4.0, "DAILY_RANGE": 6.0,
        "HIGH_LOW_RATIO": 1.06, "OPEN_CLOSE_RATIO": 0.96,
        "PREVIOUS_CLOSE": 102.0, "PREVIOUS_VOLUME": 14200.0,
        "ROLLING_MEAN_5": 101.5, "VOLATILITY": 1.8, "PREVIOUS_RSI": 53.0
    }

    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "confidence" in data
    assert data["prediction"] in ["BUY", "SELL", "HOLD"]
