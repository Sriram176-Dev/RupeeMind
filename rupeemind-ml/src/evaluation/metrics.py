from pathlib import Path
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)
from src.utils.constants import REPORTS_DIR


class EvaluatorMetrics:
    """
    Computes comprehensive evaluation metrics for classification models.
    """

    def __init__(self, reports_dir: Path = REPORTS_DIR):
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def calculate_all(self, y_true, y_pred, average: str = "weighted") -> dict:
        metrics = {
            "accuracy": accuracy_score(y_true, y_pred),
            "precision": precision_score(y_true, y_pred, average=average, zero_division=0),
            "recall": recall_score(y_true, y_pred, average=average, zero_division=0),
            "f1_score": f1_score(y_true, y_pred, average=average, zero_division=0),
        }
        return metrics

    def get_classification_report(self, y_true, y_pred, target_names=None) -> str:
        return classification_report(y_true, y_pred, target_names=target_names, zero_division=0)

    def get_confusion_matrix(self, y_true, y_pred):
        return confusion_matrix(y_true, y_pred)

    def compute_feature_importance(self, model, feature_names: list) -> pd.DataFrame:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            df = pd.DataFrame({
                "Feature": feature_names,
                "Importance": importances
            }).sort_values(by="Importance", ascending=False).reset_index(drop=True)
            return df
        else:
            raise AttributeError("Model does not have feature_importances_ attribute.")
