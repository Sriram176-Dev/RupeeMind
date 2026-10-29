from pathlib import Path
import joblib
from sklearn.preprocessing import LabelEncoder
from src.utils.constants import SAVED_MODELS_DIR


class TargetEncoder:
    """
    Wraps LabelEncoder for target variable encoding and decoding.
    """

    def __init__(self, model_dir: Path = SAVED_MODELS_DIR):
        self.model_dir = Path(model_dir)
        self.encoder = LabelEncoder()
        self.is_fitted = False

    def fit(self, y):
        self.encoder.fit(y)
        self.is_fitted = True
        return self

    def transform(self, y):
        if not self.is_fitted:
            raise ValueError("TargetEncoder is not fitted yet.")
        return self.encoder.transform(y)

    def fit_transform(self, y):
        transformed = self.encoder.fit_transform(y)
        self.is_fitted = True
        return transformed

    def inverse_transform(self, y):
        if not self.is_fitted:
            raise ValueError("TargetEncoder is not fitted yet.")
        return self.encoder.inverse_transform(y)

    def save(self, filename: str = "label_encoder.pkl"):
        self.model_dir.mkdir(parents=True, exist_ok=True)
        file_path = self.model_dir / filename
        joblib.dump(self.encoder, file_path)
        return file_path

    def load(self, filename: str = "label_encoder.pkl"):
        file_path = self.model_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Encoder file not found at {file_path}")
        self.encoder = joblib.load(file_path)
        self.is_fitted = True
        return self
