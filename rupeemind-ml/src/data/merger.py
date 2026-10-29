from pathlib import Path
import pandas as pd


class DataMerger:
    """
    Merges all labeled datasets into one dataset.
    """

    def __init__(self):
        self.output_directory = Path("data/final")
        self.output_directory.mkdir(parents=True, exist_ok=True)

    def merge(self, labeled_stocks: dict):

        merged_dataframe = []

        for stock_name, dataframe in labeled_stocks.items():

            df = dataframe.copy()

            # Keep stock name
            df["STOCK"] = stock_name

            merged_dataframe.append(df)

        final_dataset = pd.concat(
            merged_dataframe,
            ignore_index=True
        )

        return final_dataset

    def save(self, dataframe):

        output_file = (
            self.output_directory /
            "training_dataset.csv"
        )

        dataframe.to_csv(
            output_file,
            index=False
        )

        print(f"\nTraining dataset saved to : {output_file}")
