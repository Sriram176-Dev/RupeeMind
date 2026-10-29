from pathlib import Path
import joblib
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV


class XGBoostTrainer:

    def __init__(self, model_directory: Path = Path("saved_models")):
        self.model_directory = Path(model_directory)
        self.model_directory.mkdir(parents=True, exist_ok=True)

    def train(self, X_train, y_train, calibrate: bool = True):
        base_model = XGBClassifier(
            objective="multi:softprob",
            num_class=3,
            n_estimators=500,
            learning_rate=0.03,
            max_depth=10,
            min_child_weight=2,
            gamma=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            eval_metric="mlogloss"
        )

        print("\nTraining Enhanced High-Confidence XGBoost Model...\n")

        if calibrate and len(X_train) >= 50:
            # Calibrate model probabilities for higher confidence calibration
            model = CalibratedClassifierCV(estimator=base_model, method="sigmoid", cv=3)
            model.fit(X_train, y_train)
        else:
            base_model.fit(X_train, y_train)
            model = base_model

        print("Training Completed Successfully.\n")
        return model

    def save(self, model, filename: str = "xgboost_model.pkl"):
        model_path = self.model_directory / filename
        joblib.dump(model, model_path)
        print(f"Model Saved : {model_path}")
