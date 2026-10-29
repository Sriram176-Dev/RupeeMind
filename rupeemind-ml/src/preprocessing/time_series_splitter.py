"""
Time-Series Aware Data Splitting with Walk-Forward Validation Support
"""
from pathlib import Path
from typing import Tuple, List, Optional
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from datetime import datetime


class TimeSeriesDataSplitter:
    """
    Time-series aware data splitter that respects temporal ordering.
    Prevents data leakage by ensuring training data comes before validation/test data.
    """

    def __init__(
        self,
        dataset_path: str = "data/final/training_dataset.csv",
        model_directory: str = "saved_models"
    ):
        self.dataset_path = Path(dataset_path)
        self.model_directory = Path(model_directory)
        self.model_directory.mkdir(parents=True, exist_ok=True)
        
    def split_temporal(
        self,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        date_column: str = "Date"
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, 
               pd.Series, pd.Series, pd.Series]:
        """
        Split data temporally: earliest data for training, latest for test.
        
        Args:
            train_ratio: Proportion for training set
            val_ratio: Proportion for validation set
            test_ratio: Proportion for test set
            date_column: Name of date column for temporal ordering
            
        Returns:
            Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        print("\n" + "=" * 70)
        print("TIME-SERIES AWARE DATA SPLITTING")
        print("=" * 70)
        
        df = pd.read_csv(self.dataset_path)
        print(f"Total samples: {len(df)}")
        
        # Sort by date if available
        if date_column in df.columns:
            df[date_column] = pd.to_datetime(df[date_column])
            df = df.sort_values(date_column).reset_index(drop=True)
            print(f"Date range: {df[date_column].min()} to {df[date_column].max()}")
        else:
            print("⚠ Warning: No date column found. Using sequential order.")
        
        # Remove non-feature columns
        drop_columns = ["LABEL", "Date", "STOCK", "FUTURE_CLOSE", "FUTURE_RETURN"]
        existing_columns = [col for col in drop_columns if col in df.columns]
        
        X = df.drop(columns=existing_columns)
        y = df["LABEL"] if "LABEL" in df.columns else df["Target"]
        
        # Encode labels
        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y)
        
        # Save encoder and feature columns
        joblib.dump(encoder, self.model_directory / "label_encoder.pkl")
        joblib.dump(X.columns.tolist(), self.model_directory / "feature_columns.pkl")
        
        # Calculate split indices
        n_samples = len(X)
        train_end = int(n_samples * train_ratio)
        val_end = int(n_samples * (train_ratio + val_ratio))
        
        # Temporal split
        X_train = X.iloc[:train_end]
        X_val = X.iloc[train_end:val_end]
        X_test = X.iloc[val_end:]
        
        y_train = y_encoded[:train_end]
        y_val = y_encoded[train_end:val_end]
        y_test = y_encoded[val_end:]
        
        # Print split information
        print(f"\n--- Split Summary ---")
        print(f"Train set: {len(X_train)} samples ({len(X_train)/n_samples*100:.1f}%)")
        print(f"Val set  : {len(X_val)} samples ({len(X_val)/n_samples*100:.1f}%)")
        print(f"Test set : {len(X_test)} samples ({len(X_test)/n_samples*100:.1f}%)")
        
        # Print class distributions
        print(f"\n--- Class Distribution ---")
        for split_name, y_split in [("Train", y_train), ("Val", y_val), ("Test", y_test)]:
            print(f"{split_name}:", end=" ")
            for class_idx, class_name in enumerate(encoder.classes_):
                count = np.sum(y_split == class_idx)
                pct = count / len(y_split) * 100 if len(y_split) > 0 else 0
                print(f"{class_name}={count}({pct:.1f}%)", end=" ")
            print()
        
        # Check for class imbalance warning
        for split_name, y_split in [("Val", y_val), ("Test", y_test)]:
            for class_idx in range(len(encoder.classes_)):
                count = np.sum(y_split == class_idx)
                if count < 10:
                    print(f"⚠ Warning: {split_name} set has only {count} samples of class {encoder.classes_[class_idx]}")
        
        # Save test set separately for later evaluation
        test_df = df.iloc[val_end:].copy()
        test_path = self.dataset_path.parent / "test_dataset.csv"
        test_df.to_csv(test_path, index=False)
        print(f"\n✓ Test set saved to {test_path}")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def split_with_gap(
        self,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        gap_days: int = 5,
        date_column: str = "Date"
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame,
               pd.Series, pd.Series, pd.Series]:
        """
        Split with a temporal gap to prevent look-ahead bias.
        
        Args:
            train_ratio: Proportion for training
            val_ratio: Proportion for validation
            test_ratio: Proportion for test
            gap_days: Days to skip between train/val and val/test
            date_column: Date column name
            
        Returns:
            Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        df = pd.read_csv(self.dataset_path)
        
        if date_column not in df.columns:
            print("⚠ Warning: Date column not found. Using regular temporal split.")
            return self.split_temporal(train_ratio, val_ratio, test_ratio)
        
        df[date_column] = pd.to_datetime(df[date_column])
        df = df.sort_values(date_column).reset_index(drop=True)
        
        # Calculate split dates with gaps
        n_samples = len(df)
        train_end_idx = int(n_samples * train_ratio)
        
        train_end_date = df[date_column].iloc[train_end_idx]
        val_start_date = train_end_date + pd.Timedelta(days=gap_days)
        
        val_end_idx = int(n_samples * (train_ratio + val_ratio))
        val_end_date = df[date_column].iloc[val_end_idx]
        test_start_date = val_end_date + pd.Timedelta(days=gap_days)
        
        # Create splits with gaps
        train_mask = df[date_column] < train_end_date
        val_mask = (df[date_column] >= val_start_date) & (df[date_column] < val_end_date)
        test_mask = df[date_column] >= test_start_date
        
        df_train = df[train_mask]
        df_val = df[val_mask]
        df_test = df[test_mask]
        
        print(f"\n✓ Split with {gap_days}-day gaps between sets")
        print(f"Train: {len(df_train)} samples (until {train_end_date.date()})")
        print(f"Gap  : {gap_days} days")
        print(f"Val  : {len(df_val)} samples ({val_start_date.date()} to {val_end_date.date()})")
        print(f"Gap  : {gap_days} days")
        print(f"Test : {len(df_test)} samples (from {test_start_date.date()})")
        
        # Extract features and labels
        drop_columns = ["LABEL", "Date", "STOCK", "FUTURE_CLOSE", "FUTURE_RETURN"]
        existing_columns = [col for col in drop_columns if col in df.columns]
        
        X_train = df_train.drop(columns=existing_columns)
        X_val = df_val.drop(columns=existing_columns)
        X_test = df_test.drop(columns=existing_columns)
        
        y_train = df_train["LABEL"] if "LABEL" in df_train.columns else df_train["Target"]
        y_val = df_val["LABEL"] if "LABEL" in df_val.columns else df_val["Target"]
        y_test = df_test["LABEL"] if "LABEL" in df_test.columns else df_test["Target"]
        
        # Encode labels
        encoder = LabelEncoder()
        y_train_encoded = encoder.fit_transform(y_train)
        y_val_encoded = encoder.transform(y_val)
        y_test_encoded = encoder.transform(y_test)
        
        # Save artifacts
        joblib.dump(encoder, self.model_directory / "label_encoder.pkl")
        joblib.dump(X_train.columns.tolist(), self.model_directory / "feature_columns.pkl")
        
        # Save test set
        test_path = self.dataset_path.parent / "test_dataset.csv"
        df_test.to_csv(test_path, index=False)
        
        return X_train, X_val, X_test, y_train_encoded, y_val_encoded, y_test_encoded
    
    def create_walk_forward_splits(
        self,
        n_splits: int = 5,
        train_window: Optional[int] = None,
        date_column: str = "Date"
    ) -> List[Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]]:
        """
        Create walk-forward validation splits for time-series cross-validation.
        
        Args:
            n_splits: Number of splits
            train_window: Fixed training window size (None = expanding window)
            date_column: Date column name
            
        Returns:
            List of (X_train, X_val, y_train, y_val) tuples
        """
        print("\n" + "=" * 70)
        print("WALK-FORWARD VALIDATION SPLITS")
        print("=" * 70)
        
        df = pd.read_csv(self.dataset_path)
        
        if date_column in df.columns:
            df[date_column] = pd.to_datetime(df[date_column])
            df = df.sort_values(date_column).reset_index(drop=True)
        
        # Remove non-feature columns
        drop_columns = ["LABEL", "Date", "STOCK", "FUTURE_CLOSE", "FUTURE_RETURN"]
        existing_columns = [col for col in drop_columns if col in df.columns]
        
        X = df.drop(columns=existing_columns)
        y = df["LABEL"] if "LABEL" in df.columns else df["Target"]
        
        # Encode labels
        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y)
        
        # Calculate split points
        n_samples = len(X)
        test_size = n_samples // (n_splits + 1)
        
        splits = []
        
        for i in range(n_splits):
            val_end = n_samples - (n_splits - i - 1) * test_size
            val_start = val_end - test_size
            
            if train_window is None:
                # Expanding window
                train_start = 0
                train_end = val_start
            else:
                # Fixed window
                train_end = val_start
                train_start = max(0, train_end - train_window)
            
            X_train_fold = X.iloc[train_start:train_end]
            X_val_fold = X.iloc[val_start:val_end]
            y_train_fold = y_encoded[train_start:train_end]
            y_val_fold = y_encoded[val_start:val_end]
            
            splits.append((X_train_fold, X_val_fold, y_train_fold, y_val_fold))
            
            window_type = "expanding" if train_window is None else f"fixed({train_window})"
            print(f"Split {i+1}: Train={len(X_train_fold)} Val={len(X_val_fold)} (Window: {window_type})")
        
        print(f"\n✓ Created {n_splits} walk-forward validation splits")
        
        return splits
    
    def check_data_leakage(
        self,
        X_train: pd.DataFrame,
        X_test: pd.DataFrame,
        date_column: str = "Date"
    ) -> bool:
        """
        Check for potential data leakage in the split.
        
        Args:
            X_train: Training features
            X_test: Test features
            date_column: Date column name
            
        Returns:
            True if no leakage detected
        """
        df = pd.read_csv(self.dataset_path)
        
        if date_column not in df.columns:
            print("⚠ Cannot check leakage: Date column not found")
            return True
        
        df[date_column] = pd.to_datetime(df[date_column])
        df = df.sort_values(date_column)
        
        train_indices = X_train.index
        test_indices = X_test.index
        
        train_dates = df.loc[train_indices, date_column]
        test_dates = df.loc[test_indices, date_column]
        
        max_train_date = train_dates.max()
        min_test_date = test_dates.min()
        
        print(f"\n--- Data Leakage Check ---")
        print(f"Latest training date: {max_train_date}")
        print(f"Earliest test date  : {min_test_date}")
        
        if max_train_date >= min_test_date:
            print("❌ LEAKAGE DETECTED: Training data overlaps with test data!")
            return False
        else:
            gap_days = (min_test_date - max_train_date).days
            print(f"✓ No leakage detected. Gap: {gap_days} days")
            return True


def create_improved_split(
    use_gap: bool = True,
    gap_days: int = 5
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame,
           pd.Series, pd.Series, pd.Series]:
    """
    Convenience function to create an improved time-series aware split.
    
    Args:
        use_gap: Whether to use temporal gap between splits
        gap_days: Number of days gap if use_gap is True
        
    Returns:
        Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    splitter = TimeSeriesDataSplitter()
    
    if use_gap:
        return splitter.split_with_gap(
            train_ratio=0.7,
            val_ratio=0.15,
            test_ratio=0.15,
            gap_days=gap_days
        )
    else:
        return splitter.split_temporal(
            train_ratio=0.7,
            val_ratio=0.15,
            test_ratio=0.15
        )
