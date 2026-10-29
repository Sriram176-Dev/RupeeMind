from pathlib import Path
import pandas as pd


class DataLoader:
    """
    Responsible for loading all datasets used in RupeeMind.
    """

    def __init__(self):

        self.scrip_path = Path("data/raw/SCRIP")
        self.index_path = Path("data/raw/INDEX")
        self.metadata_path = Path("data/raw/METADATA")

    # --------------------------------------------------
    # Load all stock CSVs
    # --------------------------------------------------

    def load_all_stocks(self):

        stocks = {}

        csv_files = list(self.scrip_path.glob("*.csv"))

        print(f"\nFound {len(csv_files)} stock files.\n")

        for file in csv_files:

            try:

                stocks[file.stem.upper()] = pd.read_csv(file)

                print(f"[OK] {file.stem}")

            except Exception as e:

                print(f"[FAIL] {file.name}")
                print(e)

        return stocks

    # --------------------------------------------------
    # Load all index CSVs
    # --------------------------------------------------

    def load_all_indices(self):

        indices = {}

        csv_files = list(self.index_path.glob("*.csv"))

        print(f"\nFound {len(csv_files)} index files.\n")

        for file in csv_files:

            try:

                indices[file.stem.upper()] = pd.read_csv(file)

                print(f"[OK] {file.stem}")

            except Exception as e:

                print(f"[FAIL] {file.name}")
                print(e)

        return indices

    # --------------------------------------------------
    # Load metadata
    # --------------------------------------------------

    def load_metadata(self):

        metadata = {}

        csv_files = list(self.metadata_path.glob("*.csv"))

        for file in csv_files:

            try:

                metadata[file.stem.upper()] = pd.read_csv(file)

            except Exception as e:

                print(e)

        return metadata
