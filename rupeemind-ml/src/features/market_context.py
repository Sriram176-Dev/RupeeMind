from pathlib import Path
import pandas as pd
from src.utils.constants import INDEX_DIR


class MarketContext:
    """
    Integrates market context indices: INDIA VIX and NIFTY 50.
    Calculates benchmark returns, market volatility, and stock relative strength.
    """

    def __init__(self, index_dir: Path = INDEX_DIR):
        self.index_dir = Path(index_dir)
        self.vix_df = self._load_vix()
        self.nifty_df = self._load_nifty()

    def _load_vix(self) -> pd.DataFrame:
        vix_path = self.index_dir / "INDIA VIX.csv"
        if not vix_path.exists():
            return pd.DataFrame()

        df = pd.read_csv(vix_path)
        if "Date" in df.columns and "Close" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            df = df.dropna(subset=["Date"]).sort_values("Date").reset_index(drop=True)
            df["VIX_CLOSE"] = df["Close"]
            df["VIX_CHANGE"] = df["Close"].pct_change()
            return df[["Date", "VIX_CLOSE", "VIX_CHANGE"]]
        return pd.DataFrame()

    def _load_nifty(self) -> pd.DataFrame:
        nifty_path = self.index_dir / "NIFTY 50.csv"
        if not nifty_path.exists():
            return pd.DataFrame()

        df = pd.read_csv(nifty_path)
        if "Date" in df.columns and "Close" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            df = df.dropna(subset=["Date"]).sort_values("Date").reset_index(drop=True)
            df["NIFTY50_CLOSE"] = df["Close"]
            df["NIFTY50_RETURN"] = df["Close"].pct_change()
            return df[["Date", "NIFTY50_CLOSE", "NIFTY50_RETURN"]]
        return pd.DataFrame()

    def merge_context(self, dataframe: pd.DataFrame) -> pd.DataFrame:
        """
        Merges VIX and NIFTY 50 context into a stock DataFrame based on Date.
        Computes RELATIVE_STRENGTH = DAILY_RETURN - NIFTY50_RETURN.
        """
        df = dataframe.copy()

        if "Date" not in df.columns:
            # Fallbacks if Date column is not present
            df["VIX_CLOSE"] = 15.0
            df["VIX_CHANGE"] = 0.0
            df["NIFTY50_CLOSE"] = 18000.0
            df["NIFTY50_RETURN"] = 0.0
            df["RELATIVE_STRENGTH"] = df.get("DAILY_RETURN", 0.0)
            return df

        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

        # Merge NIFTY 50
        if not self.nifty_df.empty:
            df = pd.merge_asof(
                df.sort_values("Date"),
                self.nifty_df,
                on="Date",
                direction="nearest"
            )
        else:
            df["NIFTY50_CLOSE"] = 18000.0
            df["NIFTY50_RETURN"] = 0.0

        # Merge VIX
        if not self.vix_df.empty:
            df = pd.merge_asof(
                df.sort_values("Date"),
                self.vix_df,
                on="Date",
                direction="nearest"
            )
        else:
            df["VIX_CLOSE"] = 15.0
            df["VIX_CHANGE"] = 0.0

        # Fill NaNs
        df["VIX_CLOSE"] = df["VIX_CLOSE"].ffill().bfill().fillna(15.0)
        df["VIX_CHANGE"] = df["VIX_CHANGE"].fillna(0.0)
        df["NIFTY50_CLOSE"] = df["NIFTY50_CLOSE"].ffill().bfill().fillna(18000.0)
        df["NIFTY50_RETURN"] = df["NIFTY50_RETURN"].fillna(0.0)

        # Compute Relative Strength
        daily_ret = df["DAILY_RETURN"] if "DAILY_RETURN" in df.columns else 0.0
        df["RELATIVE_STRENGTH"] = daily_ret - df["NIFTY50_RETURN"]

        return df.reset_index(drop=True)
