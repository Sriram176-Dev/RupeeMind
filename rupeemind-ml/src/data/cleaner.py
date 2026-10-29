from pathlib import Path
import pandas as pd


class DataCleaner:
    """
    Cleans stock market datasets.
    """

    def __init__(self):
        self.output_directory = Path("data/cleaned")
        self.output_directory.mkdir(parents=True, exist_ok=True)

    def clean(self, stock_name: str, dataframe: pd.DataFrame):

        df = dataframe.copy()

        # ---------------------------------------
        # Remove Duplicate Rows
        # ---------------------------------------

        df.drop_duplicates(inplace=True)

        # ---------------------------------------
        # Convert Date Column
        # ---------------------------------------

        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(
                df["Date"],
                errors="coerce"
            )

        # ---------------------------------------
        # Remove Invalid Dates
        # ---------------------------------------

        if "Date" in df.columns:
            df = df.dropna(subset=["Date"])

        # ---------------------------------------
        # Sort by Date
        # ---------------------------------------

        if "Date" in df.columns:
            df.sort_values(
                by="Date",
                inplace=True
            )

        # ---------------------------------------
        # Fill Missing Values
        # ---------------------------------------

        df = df.ffill()
        df = df.bfill()

        # ---------------------------------------
        # Remove Negative Prices
        # ---------------------------------------

        price_columns = [
            "Open",
            "High",
            "Low",
            "Close"
        ]

        for column in price_columns:

            if column in df.columns:

                df = df[df[column] >= 0]

        # ---------------------------------------
        # Remove Negative Volume
        # ---------------------------------------

        if "Volume" in df.columns:
            df = df[df["Volume"] >= 0]

        # ---------------------------------------
        # Remove High < Low
        # ---------------------------------------

        if (
            "High" in df.columns
            and "Low" in df.columns
        ):

            df = df[df["High"] >= df["Low"]]

        # ---------------------------------------
        # Reset Index
        # ---------------------------------------

        df.reset_index(
            drop=True,
            inplace=True
        )

        return df

    # ---------------------------------------
    # Save Clean Dataset
    # ---------------------------------------

    def save(self, stock_name: str, dataframe: pd.DataFrame):

        file_path = self.output_directory / f"{stock_name}.csv"

        dataframe.to_csv(
            file_path,
            index=False
        )
