import json
from datetime import datetime
from pathlib import Path
import joblib
from src.utils.constants import SAVED_MODELS_DIR


class ModelSaver:
    """
    Handles saving and loading model binaries along with feature metadata.
    """

    def __init__(self, model_directory: Path = SAVED_MODELS_DIR):
        self.model_directory = Path(model_directory)
        self.model_directory.mkdir(parents=True, exist_ok=True)

    def save_model(self, model, model_name: str = "xgboost_model.pkl") -> Path:
        model_path = self.model_directory / model_name
        joblib.dump(model, model_path)
        print(f"Model saved to : {model_path}")
        return model_path

    def save_feature_columns(self, feature_columns: list, filename: str = "feature_columns.pkl") -> Path:
        path = self.model_directory / filename
        joblib.dump(feature_columns, path)
        print(f"Feature columns saved to : {path}")
        return path

    def save_metadata(self, metadata: dict, filename: str = "model_metadata.json") -> Path:
        metadata["saved_at"] = datetime.now().isoformat()
        path = self.model_directory / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4)
        print(f"Model metadata saved to : {path}")
        return path

    def load_model(self, model_name: str = "xgboost_model.pkl"):
        model_path = self.model_directory / model_name
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}")
        return joblib.load(model_path)

    def load_feature_columns(self, filename: str = "feature_columns.pkl") -> list:
        path = self.model_directory / filename
        if not path.exists():
            raise FileNotFoundError(f"Feature columns file not found at {path}")
        return joblib.load(path)
