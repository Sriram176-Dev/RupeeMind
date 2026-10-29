from pathlib import Path

# Directory Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
SCRIP_DIR = RAW_DATA_DIR / "SCRIP"
INDEX_DIR = RAW_DATA_DIR / "INDEX"
METADATA_DIR = RAW_DATA_DIR / "METADATA"

CLEANED_DATA_DIR = DATA_DIR / "cleaned"
FINAL_DATA_DIR = DATA_DIR / "final"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
REPORTS_DIR = BASE_DIR / "reports"
LOGS_DIR = BASE_DIR / "logs"

# Data Requirements
REQUIRED_COLUMNS = ["Date", "Open", "High", "Low", "Close", "Volume"]
PRICE_COLUMNS = ["Open", "High", "Low", "Close"]

# Label Generation Thresholds
FUTURE_DAYS_DEFAULT = 10
BUY_THRESHOLD_DEFAULT = 5.0
SELL_THRESHOLD_DEFAULT = -5.0

# Target Labels
LABEL_BUY = "BUY"
LABEL_SELL = "SELL"
LABEL_HOLD = "HOLD"
TARGET_LABELS = [LABEL_BUY, LABEL_SELL, LABEL_HOLD]

# XGBoost Parameters
XGB_NUM_CLASS = 3
XGB_N_ESTIMATORS = 300
XGB_LEARNING_RATE = 0.05
XGB_MAX_DEPTH = 8
XGB_SUBSAMPLE = 0.8
XGB_COLSAMPLE_BYTREE = 0.8
XGB_RANDOM_STATE = 42
XGB_EVAL_METRIC = "mlogloss"
