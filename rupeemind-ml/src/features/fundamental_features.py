"""
Enhanced Fundamental Analysis Features
Including P/E ratios, market cap categories, valuation metrics, and sector analysis.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Optional


class FundamentalFeatures:
    """
    Advanced fundamental analysis features for stock prediction.
    """
    
    def __init__(self):
        self.sector_performance = {}
        self.market_cap_categories = {
            'micro': (0, 5e9),          # < 500 Cr
            'small': (5e9, 20e9),       # 500 Cr - 2000 Cr
            'mid': (20e9, 100e9),       # 2000 Cr - 10,000 Cr
            'large': (100e9, 500e9),    # 10,000 Cr - 50,000 Cr
            'mega': (500e9, float('inf'))  # > 50,000 Cr
        }
    
    def add_valuation_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add valuation-based features.
        
        Args:
            df: DataFrame with price and fundamental data
            
        Returns:
            DataFrame with valuation features
        """
        # P/E categories
        if 'PE_RATIO' in df.columns:
            df['PE_CATEGORY'] = self._categorize_pe(df['PE_RATIO'])
            df['IS_UNDERVALUED'] = (df['PE_RATIO'] < 15).astype(int)
            df['IS_OVERVALUED'] = (df['PE_RATIO'] > 30).astype(int)
            df['PE_NORMALIZED'] = np.clip(df['PE_RATIO'] / 50.0, 0, 1)
        
        # Market cap categories
        if 'MARKET_CAP' in df.columns:
            df['MARKET_CAP_CATEGORY'] = df['MARKET_CAP'].apply(
                self._categorize_market_cap
            )
            df['IS_LARGE_CAP'] = (df['MARKET_CAP'] > 100e9).astype(int)
            df['IS_MID_CAP'] = ((df['MARKET_CAP'] >= 20e9) & 
                               (df['MARKET_CAP'] < 100e9)).astype(int)
            df['IS_SMALL_CAP'] = (df['MARKET_CAP'] < 20e9).astype(int)
        
        # Price-to-book approximation using volatility as proxy
        if 'VOLATILITY_PCT' in df.columns and 'Close' in df.columns:
            # Higher volatility might indicate growth stocks
            df['GROWTH_INDICATOR'] = df['VOLATILITY_PCT'] / df['VOLATILITY_PCT'].median()
        
        return df
    
    def add_price_to_fundamentals_ratios(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate ratios between price and fundamental metrics.
        
        Args:
            df: DataFrame with price and fundamental data
            
        Returns:
            DataFrame with price-to-fundamental ratios
        """
        if 'Close' not in df.columns:
            return df
        
        # Price relative to market cap (per share valuation proxy)
        if 'MARKET_CAP' in df.columns:
            # Normalize by market cap to get relative price strength
            df['PRICE_TO_MCAP_RATIO'] = df['Close'] / (df['MARKET_CAP'] / 1e9)
        
        # Earnings yield (inverse of P/E)
        if 'PE_RATIO' in df.columns:
            df['EARNINGS_YIELD'] = 1.0 / df['PE_RATIO'].replace(0, np.nan)
            df['EARNINGS_YIELD'] = df['EARNINGS_YIELD'].fillna(0)
        
        # Volatility-adjusted returns
        if 'VOLATILITY_PCT' in df.columns and 'DAILY_RETURN' in df.columns:
            df['SHARPE_PROXY'] = df['DAILY_RETURN'] / df['VOLATILITY_PCT'].replace(0, 1)
        
        return df
    
    def add_sector_relative_metrics(
        self,
        df: pd.DataFrame,
        sector_col: str = 'SECTOR_CODE'
    ) -> pd.DataFrame:
        """
        Add sector-relative performance metrics.
        
        Args:
            df: DataFrame with sector information
            sector_col: Column name containing sector information
            
        Returns:
            DataFrame with sector-relative features
        """
        if sector_col not in df.columns or 'Close' not in df.columns:
            return df
        
        # Calculate sector average performance
        df['SECTOR_AVG_RETURN'] = df.groupby(sector_col)['DAILY_RETURN'].transform('mean')
        df['OUTPERFORM_SECTOR'] = (df['DAILY_RETURN'] > df['SECTOR_AVG_RETURN']).astype(int)
        
        # Sector volatility
        df['SECTOR_VOLATILITY'] = df.groupby(sector_col)['Close'].transform(
            lambda x: x.pct_change().rolling(20).std()
        )
        
        return df
    
    def add_liquidity_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add liquidity and trading activity metrics.
        
        Args:
            df: DataFrame with volume and price data
            
        Returns:
            DataFrame with liquidity features
        """
        if 'Volume' not in df.columns or 'Close' not in df.columns:
            return df
        
        # Dollar volume (proxy for liquidity)
        df['DOLLAR_VOLUME'] = df['Volume'] * df['Close']
        df['AVG_DOLLAR_VOLUME_20D'] = df['DOLLAR_VOLUME'].rolling(20).mean()
        
        # Liquidity score (normalized)
        if 'MARKET_CAP' in df.columns:
            df['LIQUIDITY_RATIO'] = df['DOLLAR_VOLUME'] / df['MARKET_CAP']
            df['IS_LIQUID'] = (df['LIQUIDITY_RATIO'] > df['LIQUIDITY_RATIO'].median()).astype(int)
        
        # Volume concentration
        df['VOLUME_CONCENTRATION'] = df['Volume'] / df['Volume'].rolling(50).sum()
        
        # Amihud illiquidity measure (price impact per unit volume)
        daily_return_abs = abs(df['DAILY_RETURN']) if 'DAILY_RETURN' in df.columns else abs(df['Close'].pct_change())
        df['ILLIQUIDITY_MEASURE'] = daily_return_abs / (df['DOLLAR_VOLUME'] + 1e-10)
        
        return df
    
    def add_quality_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate quality scores based on multiple fundamental factors.
        
        Args:
            df: DataFrame with fundamental data
            
        Returns:
            DataFrame with quality scores
        """
        # Initialize quality score
        df['QUALITY_SCORE'] = 50.0  # Baseline
        
        # Positive factors
        if 'MARKET_CAP' in df.columns:
            # Large cap = more stable
            df.loc[df['MARKET_CAP'] > 100e9, 'QUALITY_SCORE'] += 10
            df.loc[df['MARKET_CAP'] > 500e9, 'QUALITY_SCORE'] += 5
        
        if 'PE_RATIO' in df.columns:
            # Reasonable P/E = better quality
            df.loc[(df['PE_RATIO'] > 10) & (df['PE_RATIO'] < 25), 'QUALITY_SCORE'] += 10
        
        if 'VOLATILITY_PCT' in df.columns:
            # Lower volatility = more stable
            df.loc[df['VOLATILITY_PCT'] < df['VOLATILITY_PCT'].median(), 'QUALITY_SCORE'] += 10
        
        # Normalize to 0-100 scale
        df['QUALITY_SCORE'] = np.clip(df['QUALITY_SCORE'], 0, 100)
        
        return df
    
    def add_risk_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add risk assessment metrics based on fundamentals.
        
        Args:
            df: DataFrame with fundamental and price data
            
        Returns:
            DataFrame with risk metrics
        """
        # Initialize risk score (higher = more risky)
        df['FUNDAMENTAL_RISK_SCORE'] = 50.0
        
        # Risk factors
        if 'VOLATILITY_PCT' in df.columns:
            # Higher volatility = more risk
            df.loc[df['VOLATILITY_PCT'] > df['VOLATILITY_PCT'].quantile(0.75), 
                   'FUNDAMENTAL_RISK_SCORE'] += 20
        
        if 'PE_RATIO' in df.columns:
            # Very high or very low P/E = risk
            df.loc[df['PE_RATIO'] > 40, 'FUNDAMENTAL_RISK_SCORE'] += 15
            df.loc[df['PE_RATIO'] < 5, 'FUNDAMENTAL_RISK_SCORE'] += 10
        
        if 'MARKET_CAP' in df.columns:
            # Small cap = higher risk
            df.loc[df['MARKET_CAP'] < 20e9, 'FUNDAMENTAL_RISK_SCORE'] += 20
            df.loc[df['MARKET_CAP'] < 5e9, 'FUNDAMENTAL_RISK_SCORE'] += 10
        
        # Normalize to 0-100 scale
        df['FUNDAMENTAL_RISK_SCORE'] = np.clip(df['FUNDAMENTAL_RISK_SCORE'], 0, 100)
        
        return df
    
    def add_momentum_fundamental_alignment(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Check if technical momentum aligns with fundamental strength.
        
        Args:
            df: DataFrame with technical and fundamental data
            
        Returns:
            DataFrame with alignment features
        """
        # Price momentum
        if 'Close' in df.columns:
            df['PRICE_MOMENTUM_20D'] = df['Close'].pct_change(20) * 100
            df['PRICE_MOMENTUM_50D'] = df['Close'].pct_change(50) * 100
        
        # Alignment score
        alignment = 0
        
        if 'PRICE_MOMENTUM_20D' in df.columns:
            # Positive momentum
            positive_momentum = df['PRICE_MOMENTUM_20D'] > 0
            
            if 'IS_UNDERVALUED' in df.columns:
                # Undervalued + positive momentum = good alignment
                df['MOMENTUM_VALUATION_ALIGNMENT'] = (
                    positive_momentum & (df['IS_UNDERVALUED'] == 1)
                ).astype(int)
            
            if 'QUALITY_SCORE' in df.columns:
                # High quality + positive momentum = good alignment
                df['MOMENTUM_QUALITY_ALIGNMENT'] = (
                    positive_momentum & (df['QUALITY_SCORE'] > 60)
                ).astype(int)
        
        return df
    
    def _categorize_pe(self, pe_ratio: pd.Series) -> pd.Series:
        """Categorize P/E ratios into buckets."""
        return pd.cut(
            pe_ratio,
            bins=[0, 10, 15, 25, 40, float('inf')],
            labels=[0, 1, 2, 3, 4]  # 0=very low, 1=low, 2=fair, 3=high, 4=very high
        ).fillna(2).astype(int)
    
    def _categorize_market_cap(self, market_cap: float) -> int:
        """Categorize market cap into buckets."""
        for idx, (category, (min_val, max_val)) in enumerate(self.market_cap_categories.items()):
            if min_val <= market_cap < max_val:
                return idx
        return 2  # Default to mid-cap


class FundamentalDataLoader:
    """
    Load and manage fundamental data from external sources.
    """
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.fundamental_cache = {}
    
    def load_stock_fundamentals(self, symbol: str) -> Optional[Dict]:
        """
        Load fundamental data for a specific stock.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dictionary with fundamental metrics
        """
        if symbol in self.fundamental_cache:
            return self.fundamental_cache[symbol]
        
        # Try to load from metadata
        metadata_path = self.data_dir / "METADATA" / "nifty50_summary_statistics.csv"
        
        if metadata_path.exists():
            try:
                df = pd.read_csv(metadata_path)
                stock_data = df[df['Ticker'].str.contains(symbol, case=False, na=False)]
                
                if not stock_data.empty:
                    row = stock_data.iloc[0]
                    fundamentals = {
                        'market_cap': float(row.get('Current_Market_Cap', 0)),
                        'pe_ratio': float(row.get('Current_PE_Ratio', 0)),
                        'volatility': float(row.get('Volatility_%', 0)),
                        'sector': str(row.get('Sector', 'Unknown')),
                        'avg_volume': float(row.get('Mean_Volume', 0))
                    }
                    
                    self.fundamental_cache[symbol] = fundamentals
                    return fundamentals
            except Exception as e:
                print(f"Warning: Could not load fundamentals for {symbol}: {e}")
        
        return None
    
    def get_sector_performance(self, sector: str, df: pd.DataFrame) -> Dict:
        """
        Calculate sector performance metrics.
        
        Args:
            sector: Sector name
            df: DataFrame with sector stocks
            
        Returns:
            Dictionary with sector metrics
        """
        sector_stocks = df[df['SECTOR'] == sector] if 'SECTOR' in df.columns else df
        
        if sector_stocks.empty:
            return {}
        
        return {
            'avg_return': sector_stocks['DAILY_RETURN'].mean() if 'DAILY_RETURN' in sector_stocks.columns else 0,
            'avg_volatility': sector_stocks['VOLATILITY_PCT'].mean() if 'VOLATILITY_PCT' in sector_stocks.columns else 0,
            'avg_pe': sector_stocks['PE_RATIO'].mean() if 'PE_RATIO' in sector_stocks.columns else 0,
            'count': len(sector_stocks)
        }


def add_all_fundamental_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convenience function to add all fundamental features.
    
    Args:
        df: DataFrame with basic price and fundamental data
        
    Returns:
        DataFrame with all fundamental features added
    """
    fundamental = FundamentalFeatures()
    
    df = fundamental.add_valuation_metrics(df)
    df = fundamental.add_price_to_fundamentals_ratios(df)
    df = fundamental.add_liquidity_metrics(df)
    df = fundamental.add_quality_scores(df)
    df = fundamental.add_risk_metrics(df)
    df = fundamental.add_momentum_fundamental_alignment(df)
    
    # Add sector metrics if sector data is available
    if 'SECTOR_CODE' in df.columns:
        df = fundamental.add_sector_relative_metrics(df)
    
    return df
