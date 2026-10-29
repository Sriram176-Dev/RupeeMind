import numpy as np
import pandas as pd
import ta


class TechnicalIndicators:
    """
    Generates core and advanced technical indicators for stock datasets.
    """

    def generate(self, dataframe: pd.DataFrame) -> pd.DataFrame:
        if len(dataframe) < 52:
            return pd.DataFrame()
            
        df = dataframe.copy()

        # -------------------------
        # RSI
        # -------------------------
        df["RSI"] = ta.momentum.RSIIndicator(
            close=df["Close"], window=14
        ).rsi()

        # -------------------------
        # EMA
        # -------------------------
        df["EMA20"] = ta.trend.EMAIndicator(
            close=df["Close"], window=20
        ).ema_indicator()

        df["EMA50"] = ta.trend.EMAIndicator(
            close=df["Close"], window=50
        ).ema_indicator()

        # -------------------------
        # SMA
        # -------------------------
        df["SMA20"] = ta.trend.SMAIndicator(
            close=df["Close"], window=20
        ).sma_indicator()

        df["SMA50"] = ta.trend.SMAIndicator(
            close=df["Close"], window=50
        ).sma_indicator()

        # -------------------------
        # MACD
        # -------------------------
        macd = ta.trend.MACD(df["Close"])
        df["MACD"] = macd.macd()
        df["MACD_SIGNAL"] = macd.macd_signal()
        df["MACD_HIST"] = macd.macd_diff()

        # -------------------------
        # Bollinger Bands
        # -------------------------
        bollinger = ta.volatility.BollingerBands(close=df["Close"])
        df["BB_HIGH"] = bollinger.bollinger_hband()
        df["BB_LOW"] = bollinger.bollinger_lband()

        # -------------------------
        # ATR & ADX
        # -------------------------
        df["ATR"] = ta.volatility.AverageTrueRange(
            high=df["High"], low=df["Low"], close=df["Close"]
        ).average_true_range()

        df["ADX"] = ta.trend.ADXIndicator(
            high=df["High"], low=df["Low"], close=df["Close"]
        ).adx()

        # -------------------------
        # OBV
        # -------------------------
        df["OBV"] = ta.volume.OnBalanceVolumeIndicator(
            close=df["Close"], volume=df["Volume"]
        ).on_balance_volume()

        # -------------------------
        # Money Flow Index (MFI)
        # -------------------------
        df["MFI"] = ta.volume.MFIIndicator(
            high=df["High"], low=df["Low"], close=df["Close"], volume=df["Volume"], window=14
        ).money_flow_index()

        # -------------------------
        # Stochastic Oscillator (%K, %D)
        # -------------------------
        stoch = ta.momentum.StochasticOscillator(
            high=df["High"], low=df["Low"], close=df["Close"], window=14, smooth_window=3
        )
        df["STOCH_K"] = stoch.stoch()
        df["STOCH_D"] = stoch.stoch_signal()

        # -------------------------
        # VWAP & Price/VWAP Ratio
        # -------------------------
        typical_price = (df["High"] + df["Low"] + df["Close"]) / 3.0
        cum_tp_vol = (typical_price * df["Volume"]).rolling(window=14).sum()
        cum_vol = df["Volume"].rolling(window=14).sum()
        df["VWAP"] = cum_tp_vol / cum_vol.replace(0, np.nan)
        df["PRICE_VWAP_RATIO"] = df["Close"] / df["VWAP"]

        # -------------------------
        # Ichimoku Kinko Hyo
        # -------------------------
        nine_high = df["High"].rolling(window=9).max()
        nine_low = df["Low"].rolling(window=9).min()
        df["TENKAN_SEN"] = (nine_high + nine_low) / 2.0

        twenty_six_high = df["High"].rolling(window=26).max()
        twenty_six_low = df["Low"].rolling(window=26).min()
        df["KIJUN_SEN"] = (twenty_six_high + twenty_six_low) / 2.0

        df["SENKOU_SPAN_A"] = (df["TENKAN_SEN"] + df["KIJUN_SEN"]) / 2.0

        fifty_two_high = df["High"].rolling(window=52).max()
        fifty_two_low = df["Low"].rolling(window=52).min()
        df["SENKOU_SPAN_B"] = (fifty_two_high + fifty_two_low) / 2.0

        # -------------------------
        # SuperTrend (ATR-based)
        # -------------------------
        hl2 = (df["High"] + df["Low"]) / 2.0
        basic_upper = hl2 + (3.0 * df["ATR"])
        basic_lower = hl2 - (3.0 * df["ATR"])

        supertrend = np.zeros(len(df))
        signal = np.ones(len(df))

        for i in range(1, len(df)):
            if df["Close"].iloc[i] > basic_upper.iloc[i - 1]:
                signal[i] = 1
            elif df["Close"].iloc[i] < basic_lower.iloc[i - 1]:
                signal[i] = -1
            else:
                signal[i] = signal[i - 1]

            if signal[i] == 1:
                supertrend[i] = basic_lower.iloc[i]
            else:
                supertrend[i] = basic_upper.iloc[i]

        df["SUPERTREND"] = supertrend
        df["SUPERTREND_SIGNAL"] = signal

        # -------------------------
        # Daily Return & Volume Change
        # -------------------------
        df["DAILY_RETURN"] = df["Close"].pct_change()
        df["VOLUME_CHANGE"] = df["Volume"].pct_change()

        # Remove NaN rows from rolling indicators
        df.dropna(inplace=True)
        df.reset_index(drop=True, inplace=True)

        return df
