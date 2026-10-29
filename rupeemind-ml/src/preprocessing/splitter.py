from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


class DataSplitter:

    def __init__(self):

        self.dataset_path = Path(
            "data/final/training_dataset.csv"
        )

        self.model_directory = Path(
            "saved_models"
        )

        self.model_directory.mkdir(
            parents=True,
            exist_ok=True
        )

    def split(self):

        df = pd.read_csv(self.dataset_path)

        # -----------------------------
        # Remove non-feature columns
        # -----------------------------

        drop_columns = [
            "LABEL",
            "Date",
            "STOCK",
            "FUTURE_CLOSE",
            "FUTURE_RETURN",
            "Symbol",
            "Series"
        ]

        existing_columns = [
            column
            for column in drop_columns
            if column in df.columns
        ]

        X = df.drop(columns=existing_columns)

        # -----------------------------
        # Handle infinite values
        # -----------------------------
        
        import numpy as np
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(0)

        y = df["LABEL"]

        # -----------------------------
        # Encode Labels
        # -----------------------------

        encoder = LabelEncoder()

        y = encoder.fit_transform(y)

        # Save encoder

        joblib.dump(
            encoder,
            self.model_directory /
            "label_encoder.pkl"
        )

        # -----------------------------
        # Save Feature Columns
        # -----------------------------

        joblib.dump(
            X.columns.tolist(),
            self.model_directory /
            "feature_columns.pkl"
        )

        # -----------------------------
        # Train Test Split
        # -----------------------------

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y
        )

        return (
            X_train,
            X_test,
            y_train,
            y_test
        )
