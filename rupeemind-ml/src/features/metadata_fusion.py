from pathlib import Path
import pandas as pd
from src.utils.constants import METADATA_DIR


class MetadataFusion:
    """
    Fuses fundamental metrics (Market Cap, P/E ratio, Volatility %, Sector) from metadata CSVs.
    """

    def __init__(self, metadata_dir: Path = METADATA_DIR):
        self.metadata_dir = Path(metadata_dir)
        self.meta_map = self._load_metadata_map()

    def _load_metadata_map(self) -> dict:
        summary_path = self.metadata_dir / "nifty50_summary_statistics.csv"
        meta_map = {}

        if summary_path.exists():
            try:
                df = pd.read_csv(summary_path)
                for _, row in df.iterrows():
                    ticker = str(row.get("Ticker", "")).split(".")[0].upper()
                    if ticker:
                        sector = str(row.get("Sector", "General"))
                        meta_map[ticker] = {
                            "MARKET_CAP": float(row.get("Current_Market_Cap", 1e11)),
                            "PE_RATIO": float(row.get("Current_PE_Ratio", 25.0)),
                            "VOLATILITY_PCT": float(row.get("Volatility_%", 2.5)),
                            "SECTOR": sector
                        }
            except Exception as e:
                print(f"Warning loading metadata map: {e}")

        return meta_map

    def merge_metadata(self, stock_name: str, dataframe: pd.DataFrame) -> pd.DataFrame:
        """
        Merges fundamental metadata columns into the stock DataFrame.
        """
        df = dataframe.copy()
        symbol = str(stock_name).upper().strip()

        meta_info = self.meta_map.get(symbol, {
            "MARKET_CAP": 5e10,
            "PE_RATIO": 20.0,
            "VOLATILITY_PCT": 2.0,
            "SECTOR": "General"
        })

        df["MARKET_CAP"] = meta_info["MARKET_CAP"]
        df["PE_RATIO"] = meta_info["PE_RATIO"]
        df["VOLATILITY_PCT"] = meta_info["VOLATILITY_PCT"]

        # Simple hashing to convert sector string to numeric feature code
        df["SECTOR_CODE"] = float(abs(hash(meta_info["SECTOR"])) % 100)

        return df
