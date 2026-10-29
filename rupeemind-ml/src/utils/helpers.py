from pathlib import Path
import joblib
import pandas as pd


def ensure_dir(path: Path) -> Path:
    """
    Ensures that a directory exists.
    """
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_artifact(obj, filepath: Path) -> Path:
    """
    Saves a Python object using joblib.
    """
    filepath = Path(filepath)
    ensure_dir(filepath.parent)
    joblib.dump(obj, filepath)
    return filepath


def load_artifact(filepath: Path):
    """
    Loads a Python object using joblib.
    """
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"Artifact not found at {filepath}")
    return joblib.load(filepath)


def summarize_dataframe(df: pd.DataFrame) -> dict:
    """
    Returns a summary dict for a pandas DataFrame.
    """
    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "missing_values": int(df.isnull().sum().sum()),
        "memory_usage_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    }
