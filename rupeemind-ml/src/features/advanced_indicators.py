"""
Advanced Technical Indicators including pattern recognition, 
Fibonacci levels, support/resistance, and market regime detection.
"""
import numpy as np
import pandas as pd
from scipy.signal import find_peaks
from typing import Tuple, List


class AdvancedIndicators:
    """
    Advanced technical indicators for enhanced market analysis.
    """
    
    def __init__(self):
        self.fibonacci_levels = [0.236, 0.382, 0.5, 0.618, 0.786]
    
    def generate_all(self, dataframe: pd.DataFrame) -> pd.DataFrame:
        """
        Generate all advanced indicators.
        
        Args:
            dataframe: DataFrame with OHLCV data and basic indicators
            
        Returns:
            DataFrame with additional advanced indicators
        """
        if len(dataframe) < 100:
            return dataframe
        
        df = dataframe.copy()
        
        # Market structure
        df = self.add_support_resistance(df)
        df = self.add_fibonacci_levels(df)
        
        # Pattern recognition
        df = self.add_candlestick_patterns(df)
        
        # Market regime
        df = self.add_market_regime(df)
        df = self.add_volatility_regime(df)
        
        # Advanced momentum
        df = self.add_rate_of_change(df)
        df = self.add_momentum_oscillator(df)
        
        # Volume analysis
        df = self.add_volume_profile(df)
        df = self.add_volume_trend(df)
        
        # Price action
        df = self.add_price_channels(df)
        df = self.add_pivot_points(df)
        
        # Trend strength
        df = self.add_trend_intensity(df)
        
        return df
    
    def add_support_resistance(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """
        Identify support and resistance levels using local minima/maxima.
        """
        highs = df['High'].values
        lows = df['Low'].values
        closes = df['Close'].values
        
        # Find local peaks (resistance) and troughs (support)
        resistance_peaks, _ = find_peaks(highs, distance=window)
        support_troughs, _ = find_peaks(-lows, distance=window)
        
        # Calculate distance to nearest support/resistance
        df['DISTANCE_TO_RESISTANCE'] = 0.0
        df['DISTANCE_TO_SUPPORT'] = 0.0
        df['NEAR_RESISTANCE'] = 0
        df['NEAR_SUPPORT'] = 0
        
        for i in range(len(df)):
            current_price = closes[i]
            
            # Distance to resistance (above current price)
            resistance_above = [highs[peak] for peak in resistance_peaks if highs[peak] > current_price]
            if resistance_above:
                nearest_resistance = min(resistance_above)
                df.loc[i, 'DISTANCE_TO_RESISTANCE'] = (nearest_resistance - current_price) / current_price
                if df.loc[i, 'DISTANCE_TO_RESISTANCE'] < 0.02:  # Within 2%
                    df.loc[i, 'NEAR_RESISTANCE'] = 1
            
            # Distance to support (below current price)
            support_below = [lows[trough] for trough in support_troughs if lows[trough] < current_price]
            if support_below:
                nearest_support = max(support_below)
                df.loc[i, 'DISTANCE_TO_SUPPORT'] = (current_price - nearest_support) / current_price
                if df.loc[i, 'DISTANCE_TO_SUPPORT'] < 0.02:  # Within 2%
                    df.loc[i, 'NEAR_SUPPORT'] = 1
        
        return df
    
    def add_fibonacci_levels(self, df: pd.DataFrame, lookback: int = 50) -> pd.DataFrame:
        """
        Calculate Fibonacci retracement levels.
        """
        df['FIB_LEVEL'] = 0.0
        
        for i in range(lookback, len(df)):
            window = df.iloc[i-lookback:i]
            high = window['High'].max()
            low = window['Low'].min()
            current = df['Close'].iloc[i]
            
            # Calculate where current price sits in Fibonacci levels
            if high != low:
                price_range = high - low
                retracement = (high - current) / price_range
                
                # Find nearest Fibonacci level
                nearest_fib = min(self.fibonacci_levels, key=lambda x: abs(x - retracement))
                df.loc[i, 'FIB_LEVEL'] = nearest_fib
        
        return df
    
    def add_candlestick_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect common candlestick patterns.
        """
        o = df['Open'].values
        h = df['High'].values
        l = df['Low'].values
        c = df['Close'].values
        
        # Body and shadow calculations
        body = c - o
        upper_shadow = h - np.maximum(o, c)
        lower_shadow = np.minimum(o, c) - l
        body_size = np.abs(body)
        
        # Pattern detection
        df['DOJI'] = 0
        df['HAMMER'] = 0
        df['SHOOTING_STAR'] = 0
        df['ENGULFING_BULL'] = 0
        df['ENGULFING_BEAR'] = 0
        
        for i in range(1, len(df)):
            # Doji: Small body, long shadows
            if body_size[i] < 0.1 * (h[i] - l[i]):
                df.loc[i, 'DOJI'] = 1
            
            # Hammer: Small upper shadow, long lower shadow, small body
            if (lower_shadow[i] > 2 * body_size[i] and 
                upper_shadow[i] < 0.3 * body_size[i]):
                df.loc[i, 'HAMMER'] = 1
            
            # Shooting Star: Long upper shadow, small body, small lower shadow
            if (upper_shadow[i] > 2 * body_size[i] and 
                lower_shadow[i] < 0.3 * body_size[i]):
                df.loc[i, 'SHOOTING_STAR'] = 1
            
            # Bullish Engulfing
            if (body[i] > 0 and body[i-1] < 0 and 
                body_size[i] > body_size[i-1] and
                c[i] > o[i-1] and o[i] < c[i-1]):
                df.loc[i, 'ENGULFING_BULL'] = 1
            
            # Bearish Engulfing
            if (body[i] < 0 and body[i-1] > 0 and 
                body_size[i] > body_size[i-1] and
                c[i] < o[i-1] and o[i] > c[i-1]):
                df.loc[i, 'ENGULFING_BEAR'] = 1
        
        return df
    
    def add_market_regime(self, df: pd.DataFrame, window: int = 50) -> pd.DataFrame:
        """
        Detect market regime: BULL, BEAR, or SIDEWAYS.
        """
        df['MARKET_REGIME'] = 0  # 0 = sideways, 1 = bull, -1 = bear
        
        for i in range(window, len(df)):
            # Calculate trend using linear regression slope
            prices = df['Close'].iloc[i-window:i].values
            x = np.arange(len(prices))
            slope = np.polyfit(x, prices, 1)[0]
            
            # Normalize slope by average price
            avg_price = np.mean(prices)
            normalized_slope = slope / avg_price if avg_price > 0 else 0
            
            # Classify regime
            if normalized_slope > 0.001:  # Uptrend
                df.loc[i, 'MARKET_REGIME'] = 1
            elif normalized_slope < -0.001:  # Downtrend
                df.loc[i, 'MARKET_REGIME'] = -1
            else:  # Sideways
                df.loc[i, 'MARKET_REGIME'] = 0
        
        return df
    
    def add_volatility_regime(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """
        Classify volatility regime: LOW, MEDIUM, HIGH.
        """
        # Calculate rolling volatility
        returns = df['Close'].pct_change()
        rolling_vol = returns.rolling(window=window).std()
        
        # Percentiles for classification
        vol_33 = rolling_vol.quantile(0.33)
        vol_66 = rolling_vol.quantile(0.66)
        
        df['VOLATILITY_REGIME'] = 0  # 0 = low, 1 = medium, 2 = high
        df.loc[rolling_vol > vol_66, 'VOLATILITY_REGIME'] = 2
        df.loc[(rolling_vol > vol_33) & (rolling_vol <= vol_66), 'VOLATILITY_REGIME'] = 1
        
        return df
    
    def add_rate_of_change(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add Rate of Change (ROC) indicators for multiple periods.
        """
        df['ROC_5'] = df['Close'].pct_change(5) * 100
        df['ROC_10'] = df['Close'].pct_change(10) * 100
        df['ROC_20'] = df['Close'].pct_change(20) * 100
        
        return df
    
    def add_momentum_oscillator(self, df: pd.DataFrame, window: int = 10) -> pd.DataFrame:
        """
        Add momentum oscillator.
        """
        df['MOMENTUM'] = df['Close'] - df['Close'].shift(window)
        df['MOMENTUM_PCT'] = (df['Close'] / df['Close'].shift(window) - 1) * 100
        
        return df
    
    def add_volume_profile(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """
        Analyze volume profile and trends.
        """
        # Volume moving average
        df['VOLUME_MA'] = df['Volume'].rolling(window=window).mean()
        
        # Volume ratio (current vs average)
        df['VOLUME_RATIO'] = df['Volume'] / df['VOLUME_MA']
        
        # High volume flag
        df['HIGH_VOLUME'] = (df['VOLUME_RATIO'] > 1.5).astype(int)
        
        return df
    
    def add_volume_trend(self, df: pd.DataFrame, window: int = 10) -> pd.DataFrame:
        """
        Detect volume trends.
        """
        # Volume trend (increasing/decreasing)
        volume_sma_short = df['Volume'].rolling(window=window).mean()
        volume_sma_long = df['Volume'].rolling(window=window*2).mean()
        
        df['VOLUME_TREND'] = 0  # 0 = neutral, 1 = increasing, -1 = decreasing
        df.loc[volume_sma_short > volume_sma_long * 1.1, 'VOLUME_TREND'] = 1
        df.loc[volume_sma_short < volume_sma_long * 0.9, 'VOLUME_TREND'] = -1
        
        return df
    
    def add_price_channels(self, df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """
        Add Donchian Price Channels.
        """
        df['CHANNEL_HIGH'] = df['High'].rolling(window=window).max()
        df['CHANNEL_LOW'] = df['Low'].rolling(window=window).min()
        df['CHANNEL_MID'] = (df['CHANNEL_HIGH'] + df['CHANNEL_LOW']) / 2
        
        # Price position in channel (0 to 1)
        df['PRICE_CHANNEL_POSITION'] = (
            (df['Close'] - df['CHANNEL_LOW']) / 
            (df['CHANNEL_HIGH'] - df['CHANNEL_LOW'])
        ).fillna(0.5)
        
        return df
    
    def add_pivot_points(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate pivot points (support/resistance levels).
        """
        # Classic pivot point
        df['PIVOT'] = (df['High'].shift(1) + df['Low'].shift(1) + df['Close'].shift(1)) / 3
        
        # Support and resistance levels
        df['R1'] = 2 * df['PIVOT'] - df['Low'].shift(1)
        df['S1'] = 2 * df['PIVOT'] - df['High'].shift(1)
        df['R2'] = df['PIVOT'] + (df['High'].shift(1) - df['Low'].shift(1))
        df['S2'] = df['PIVOT'] - (df['High'].shift(1) - df['Low'].shift(1))
        
        # Distance from pivot
        df['DISTANCE_FROM_PIVOT'] = (df['Close'] - df['PIVOT']) / df['PIVOT']
        
        return df
    
    def add_trend_intensity(self, df: pd.DataFrame, window: int = 14) -> pd.DataFrame:
        """
        Calculate trend intensity using ADX-like metric.
        """
        # True Range
        tr1 = df['High'] - df['Low']
        tr2 = abs(df['High'] - df['Close'].shift(1))
        tr3 = abs(df['Low'] - df['Close'].shift(1))
        true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        
        # Directional Movement
        up_move = df['High'] - df['High'].shift(1)
        down_move = df['Low'].shift(1) - df['Low']
        
        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
        
        # Smooth with exponential moving average
        atr = true_range.ewm(span=window, adjust=False).mean()
        plus_di = 100 * pd.Series(plus_dm).ewm(span=window, adjust=False).mean() / atr
        minus_di = 100 * pd.Series(minus_dm).ewm(span=window, adjust=False).mean() / atr
        
        # Directional Index
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
        df['TREND_INTENSITY'] = dx.ewm(span=window, adjust=False).mean()
        
        return df


class MarketContextFeatures:
    """
    Features that provide market context and relative performance.
    """
    
    @staticmethod
    def add_relative_strength_index_comparison(
        df: pd.DataFrame,
        index_df: pd.DataFrame,
        window: int = 14
    ) -> pd.DataFrame:
        """
        Compare stock performance relative to market index.
        
        Args:
            df: Stock dataframe
            index_df: Market index dataframe (e.g., NIFTY 50)
            window: Rolling window
            
        Returns:
            DataFrame with relative strength features
        """
        if 'Date' not in df.columns or 'Date' not in index_df.columns:
            return df
        
        # Merge on date
        merged = df.merge(
            index_df[['Date', 'Close']],
            on='Date',
            how='left',
            suffixes=('', '_INDEX')
        )
        
        if 'Close_INDEX' not in merged.columns:
            return df
        
        # Calculate relative strength
        stock_return = merged['Close'].pct_change(window)
        index_return = merged['Close_INDEX'].pct_change(window)
        
        df['RELATIVE_STRENGTH'] = stock_return - index_return
        df['OUTPERFORMING_INDEX'] = (df['RELATIVE_STRENGTH'] > 0).astype(int)
        
        return df
    
    @staticmethod
    def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Add time-based features (day of week, month, quarter effects).
        """
        if 'Date' not in df.columns:
            return df
        
        df['Date'] = pd.to_datetime(df['Date'])
        
        df['DAY_OF_WEEK'] = df['Date'].dt.dayofweek  # 0 = Monday
        df['MONTH'] = df['Date'].dt.month
        df['QUARTER'] = df['Date'].dt.quarter
        df['IS_MONTH_START'] = df['Date'].dt.is_month_start.astype(int)
        df['IS_MONTH_END'] = df['Date'].dt.is_month_end.astype(int)
        df['IS_QUARTER_START'] = df['Date'].dt.is_quarter_start.astype(int)
        df['IS_QUARTER_END'] = df['Date'].dt.is_quarter_end.astype(int)
        
        return df
