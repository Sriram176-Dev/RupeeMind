from pathlib import Path

import joblib
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)


class ModelEvaluator:

    def __init__(self):

        self.report_directory = Path("reports")

        self.report_directory.mkdir(
            parents=True,
            exist_ok=True
        )

    def evaluate(
        self,
        model,
        X_test,
        y_test
    ):

        predictions = model.predict(X_test)

        accuracy = accuracy_score(
            y_test,
            predictions
        )

        precision = precision_score(
            y_test,
            predictions,
            average="weighted"
        )

        recall = recall_score(
            y_test,
            predictions,
            average="weighted"
        )

        f1 = f1_score(
            y_test,
            predictions,
            average="weighted"
        )

        print("\n")
        print("=" * 70)
        print("MODEL EVALUATION")
        print("=" * 70)

        print(f"Accuracy  : {accuracy:.4f}")
        print(f"Precision : {precision:.4f}")
        print(f"Recall    : {recall:.4f}")
        print(f"F1 Score  : {f1:.4f}")

        report = classification_report(
            y_test,
            predictions
        )

        print("\nClassification Report\n")
        print(report)

        with open(
            self.report_directory /
            "classification_report.txt",
            "w"
        ) as file:

            file.write(report)

        # -------------------------
        # Confusion Matrix
        # -------------------------

        cm = confusion_matrix(
            y_test,
            predictions
        )

        disp = ConfusionMatrixDisplay(
            confusion_matrix=cm
        )

        disp.plot()

        plt.savefig(
            self.report_directory /
            "confusion_matrix.png"
        )

        plt.close()

        # -------------------------
        # Feature Importance
        # -------------------------

        importance = None
        if hasattr(model, "feature_importances_"):
            importance = model.feature_importances_
        elif hasattr(model, "calibrated_classifiers_") and len(model.calibrated_classifiers_) > 0:
            importances = [
                clf.estimator.feature_importances_
                for clf in model.calibrated_classifiers_
                if hasattr(clf.estimator, "feature_importances_")
            ]
            if importances:
                import numpy as np
                importance = np.mean(importances, axis=0)

        if importance is not None and Path("saved_models/feature_columns.pkl").exists():
            columns = joblib.load("saved_models/feature_columns.pkl")

            feature_importance = sorted(
                zip(columns, importance),
                key=lambda x: x[1],
                reverse=True
            )

            with open(
                self.report_directory /
                "feature_importance.txt",
                "w"
            ) as file:
                for feature, score in feature_importance:
                    file.write(f"{feature} : {score:.6f}\n")

        print("\nEvaluation Completed Successfully.")
