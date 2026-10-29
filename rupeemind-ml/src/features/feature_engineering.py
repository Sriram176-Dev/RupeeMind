import pandas as pd
from src.features.market_context import MarketContext
from src.features.metadata_fusion import MetadataFusion
from src.features.advanced_indicators import AdvancedIndicators, MarketContextFeatures
from src.features.fundamental_features import FundamentalFeatures


class FeatureEngineering:
    """
    Creates additional machine learning features including price ratios, lag features,
    rolling statistics, advanced technical indicators, fundamental analysis, 
    market context, and metadata metrics.
    """

    def __init__(self, use_advanced_features: bool = True, use_fundamentals: bool = True):
        """
        Initialize feature engineering.
        
        Args:
            use_advanced_features: If True, include advanced technical indicators
            use_fundamentals: If True, include fundamental analysis features
        """
        self.market_context = MarketContext()
        self.metadata_fusion = MetadataFusion()
        self.use_advanced_features = use_advanced_features
        self.use_fundamentals = use_fundamentals
        
        if use_advanced_features:
            self.advanced_indicators = AdvancedIndicators()
            self.context_features = MarketContextFeatures()
        
        if use_fundamentals:
            self.fundamental_features = FundamentalFeatures()

    def generate(self, dataframe: pd.DataFrame, stock_name: str = "STOCK") -> pd.DataFrame:
        if dataframe.empty:
            return pd.DataFrame()
            
        df = dataframe.copy()

        # ---------------------------------------
        # Price Change & Ratios
        # ---------------------------------------
        df["PRICE_CHANGE"] = df["Close"] - df["Open"]
        df["PRICE_CHANGE_PERCENT"] = ((df["Close"] - df["Open"]) / df["Open"]) * 100.0
        df["DAILY_RANGE"] = df["High"] - df["Low"]
        df["HIGH_LOW_RATIO"] = df["High"] / df["Low"].replace(0, 1e-6)
        df["OPEN_CLOSE_RATIO"] = df["Open"] / df["Close"].replace(0, 1e-6)

        # ---------------------------------------
        # Lags & Rolling Statistics
        # ---------------------------------------
        df["PREVIOUS_CLOSE"] = df["Close"].shift(1)
        df["PREVIOUS_VOLUME"] = df["Volume"].shift(1)
        df["ROLLING_MEAN_5"] = df["Close"].rolling(window=5).mean()
        df["VOLATILITY"] = df["Close"].rolling(window=5).std()

        if "RSI" in df.columns:
            df["PREVIOUS_RSI"] = df["RSI"].shift(1)

        # ---------------------------------------
        # Market Context & Relative Strength
        # ---------------------------------------
        df = self.market_context.merge_context(df)

        # ---------------------------------------
        # Fundamental & Metadata Fusion
        # ---------------------------------------
        df = self.metadata_fusion.merge_metadata(stock_name, df)

        # ---------------------------------------
        # Fundamental Analysis Features
        # ---------------------------------------
        if self.use_fundamentals:
            try:
                df = self.fundamental_features.add_valuation_metrics(df)
                df = self.fundamental_features.add_price_to_fundamentals_ratios(df)
                df = self.fundamental_features.add_liquidity_metrics(df)
                df = self.fundamental_features.add_quality_scores(df)
                df = self.fundamental_features.add_risk_metrics(df)
                df = self.fundamental_features.add_momentum_fundamental_alignment(df)
                
                if 'SECTOR_CODE' in df.columns:
                    df = self.fundamental_features.add_sector_relative_metrics(df)
            except Exception as e:
                print(f"⚠ Warning: Could not add some fundamental features: {e}")

        # ---------------------------------------
        # Advanced Technical Indicators
        # ---------------------------------------
        if self.use_advanced_features and len(df) >= 100:
            try:
                df = self.advanced_indicators.generate_all(df)
                df = self.context_features.add_time_features(df)
            except Exception as e:
                print(f"⚠ Warning: Could not add some advanced features: {e}")

        # Remove NaN values from rolling/lags
        df.dropna(inplace=True)
        df.reset_index(drop=True, inplace=True)

        return df
