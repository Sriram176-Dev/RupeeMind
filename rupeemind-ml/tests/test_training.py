import pytest
import pandas as pd
import numpy as np
from pathlib import Path

from src.models.train_xgboost import XGBoostTrainer
from src.evaluation.evaluate import ModelEvaluator
from src.preprocessing.encoder import TargetEncoder
from src.preprocessing.scaler import FeatureScaler
from src.models.save_model import ModelSaver


@pytest.fixture
def dummy_train_data():
    np.random.seed(42)
    X = pd.DataFrame({
        "feature_1": np.random.randn(100),
        "feature_2": np.random.randn(100),
        "feature_3": np.random.randn(100)
    })
    y = np.random.choice([0, 1, 2], size=100)
    return X, y


def test_target_encoder():
    encoder = TargetEncoder()
    labels = ["BUY", "SELL", "HOLD", "BUY", "SELL"]
    encoded = encoder.fit_transform(labels)
    assert len(encoded) == len(labels)
    decoded = encoder.inverse_transform(encoded)
    assert list(decoded) == labels


def test_feature_scaler(dummy_train_data):
    X, _ = dummy_train_data
    scaler = FeatureScaler()
    scaled_X = scaler.fit_transform(X)
    assert scaled_X.shape == X.shape
    assert abs(scaled_X["feature_1"].mean()) < 1e-5


def test_xgboost_trainer(dummy_train_data, tmp_path):
    X, y = dummy_train_data
    trainer = XGBoostTrainer()
    trainer.model_directory = tmp_path

    model = trainer.train(X, y)
    assert model is not None

    trainer.save(model)
    saved_model_file = tmp_path / "xgboost_model.pkl"
    assert saved_model_file.exists()


def test_model_evaluator(dummy_train_data, tmp_path):
    X, y = dummy_train_data
    trainer = XGBoostTrainer()
    model = trainer.train(X, y)

    evaluator = ModelEvaluator()
    evaluator.report_directory = tmp_path
    evaluator.evaluate(model, X, y)

    report_file = tmp_path / "classification_report.txt"
    matrix_file = tmp_path / "confusion_matrix.png"

    assert report_file.exists()
    assert matrix_file.exists()


def test_model_saver(dummy_train_data, tmp_path):
    X, y = dummy_train_data
    saver = ModelSaver(model_directory=tmp_path)
    trainer = XGBoostTrainer()
    model = trainer.train(X, y)

    saver.save_model(model, "test_model.pkl")
    saver.save_feature_columns(list(X.columns), "test_features.pkl")
    saver.save_metadata({"accuracy": 0.95}, "test_meta.json")

    assert (tmp_path / "test_model.pkl").exists()
    assert (tmp_path / "test_features.pkl").exists()
    assert (tmp_path / "test_meta.json").exists()

    loaded_model = saver.load_model("test_model.pkl")
    assert loaded_model is not None
    loaded_cols = saver.load_feature_columns("test_features.pkl")
    assert loaded_cols == list(X.columns)
