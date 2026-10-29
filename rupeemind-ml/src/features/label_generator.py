import pandas as pd


class LabelGenerator:
    """
    Generates BUY / SELL / HOLD labels
    based on future returns.
    """

    def __init__(self,
                 future_days=10,
                 buy_threshold=5,
                 sell_threshold=-5):

        self.future_days = future_days
        self.buy_threshold = buy_threshold
        self.sell_threshold = sell_threshold

    def generate(self, dataframe: pd.DataFrame):
        if dataframe.empty:
            return pd.DataFrame()

        df = dataframe.copy()

        # -----------------------------------
        # Future Close Price
        # -----------------------------------

        df["FUTURE_CLOSE"] = (
            df["Close"]
            .shift(-self.future_days)
        )

        # -----------------------------------
        # Future Return %
        # -----------------------------------

        df["FUTURE_RETURN"] = (
            (df["FUTURE_CLOSE"] - df["Close"])
            / df["Close"]
        ) * 100

        # -----------------------------------
        # Generate Labels
        # -----------------------------------

        labels = []

        for value in df["FUTURE_RETURN"]:

            if pd.isna(value):

                labels.append(None)

            elif value >= self.buy_threshold:

                labels.append("BUY")

            elif value <= self.sell_threshold:

                labels.append("SELL")

            else:

                labels.append("HOLD")

        df["LABEL"] = labels

        # -----------------------------------
        # Remove rows without labels
        # -----------------------------------

        df.dropna(inplace=True)

        df.reset_index(drop=True, inplace=True)

        return df
