from pathlib import Path
import pandas as pd


class DataValidator:
    """
    Validates stock market datasets before preprocessing.
    """

    REQUIRED_COLUMNS = [
        "Date",
        "Open",
        "High",
        "Low",
        "Close",
        "Volume"
    ]

    def __init__(self):
        self.report = []

    def validate(self, stock_name: str, dataframe: pd.DataFrame):

        result = {
            "Stock": stock_name,
            "Rows": len(dataframe),
            "Columns": len(dataframe.columns),
            "Missing Values": 0,
            "Duplicate Rows": 0,
            "Negative Prices": 0,
            "Negative Volume": 0,
            "High < Low": 0,
            "Missing Columns": [],
            "Status": "VALID"
        }

        # ----------------------------------------
        # Check Required Columns
        # ----------------------------------------

        for column in self.REQUIRED_COLUMNS:

            if column not in dataframe.columns:
                result["Missing Columns"].append(column)

        if result["Missing Columns"]:
            result["Status"] = "INVALID"

        # ----------------------------------------
        # Missing Values
        # ----------------------------------------

        result["Missing Values"] = dataframe.isnull().sum().sum()

        # ----------------------------------------
        # Duplicate Rows
        # ----------------------------------------

        result["Duplicate Rows"] = dataframe.duplicated().sum()

        # ----------------------------------------
        # Negative Prices
        # ----------------------------------------

        price_columns = ["Open", "High", "Low", "Close"]

        if all(col in dataframe.columns for col in price_columns):

            negative_prices = (
                (dataframe["Open"] < 0)
                | (dataframe["High"] < 0)
                | (dataframe["Low"] < 0)
                | (dataframe["Close"] < 0)
            )

            result["Negative Prices"] = negative_prices.sum()

        # ----------------------------------------
        # Negative Volume
        # ----------------------------------------

        if "Volume" in dataframe.columns:
            result["Negative Volume"] = (
                dataframe["Volume"] < 0
            ).sum()

        # ----------------------------------------
        # High < Low
        # ----------------------------------------

        if "High" in dataframe.columns and "Low" in dataframe.columns:

            result["High < Low"] = (
                dataframe["High"] < dataframe["Low"]
            ).sum()

        # ----------------------------------------
        # Empty Dataset
        # ----------------------------------------

        if dataframe.empty:
            result["Status"] = "INVALID"

        # ----------------------------------------
        # Warning Status
        # ----------------------------------------

        if (
            result["Missing Values"] > 0
            or result["Duplicate Rows"] > 0
            or result["Negative Prices"] > 0
            or result["Negative Volume"] > 0
            or result["High < Low"] > 0
        ):

            if result["Status"] != "INVALID":
                result["Status"] = "WARNING"

        self.report.append(result)

        return result

    # -----------------------------------------------------

    def save_report(self, filename="reports/validation_report.txt"):

        path = Path(filename)

        path.parent.mkdir(parents=True, exist_ok=True)

        with open(path, "w", encoding="utf-8") as file:

            file.write("=" * 70 + "\n")
            file.write("RUPEEMIND DATA VALIDATION REPORT\n")
            file.write("=" * 70 + "\n\n")

            for item in self.report:

                file.write(f"Stock             : {item['Stock']}\n")
                file.write(f"Rows              : {item['Rows']}\n")
                file.write(f"Columns           : {item['Columns']}\n")
                file.write(f"Missing Values    : {item['Missing Values']}\n")
                file.write(f"Duplicate Rows    : {item['Duplicate Rows']}\n")
                file.write(f"Negative Prices   : {item['Negative Prices']}\n")
                file.write(f"Negative Volume   : {item['Negative Volume']}\n")
                file.write(f"High < Low        : {item['High < Low']}\n")
                file.write(f"Missing Columns   : {item['Missing Columns']}\n")
                file.write(f"Status            : {item['Status']}\n")
                file.write("-" * 70 + "\n")

        print(f"\nValidation report saved to: {filename}")
