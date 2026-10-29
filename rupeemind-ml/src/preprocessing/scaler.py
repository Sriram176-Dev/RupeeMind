from pathlib import Path
import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler
from src.utils.constants import SAVED_MODELS_DIR


class FeatureScaler:
    """
    Wraps StandardScaler for scaling numerical features in stock datasets.
    """

    def __init__(self, model_dir: Path = SAVED_MODELS_DIR):
        self.model_dir = Path(model_dir)
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: pd.DataFrame):
        self.scaler.fit(X)
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        if not self.is_fitted:
            raise ValueError("FeatureScaler is not fitted yet.")
        scaled_array = self.scaler.transform(X)
        return pd.DataFrame(scaled_array, columns=X.columns, index=X.index)

    def fit_transform(self, X: pd.DataFrame) -> pd.DataFrame:
        scaled_array = self.scaler.fit_transform(X)
        self.is_fitted = True
        return pd.DataFrame(scaled_array, columns=X.columns, index=X.index)

    def save(self, filename: str = "scaler.pkl") -> Path:
        self.model_dir.mkdir(parents=True, exist_ok=True)
        file_path = self.model_dir / filename
        joblib.dump(self.scaler, file_path)
        return file_path

    def load(self, filename: str = "scaler.pkl"):
        file_path = self.model_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Scaler file not found at {file_path}")
        self.scaler = joblib.load(file_path)
        self.is_fitted = True
        return self
