from src.data.loader import DataLoader
from src.data.validator import DataValidator
from src.data.cleaner import DataCleaner
from src.features.indicators import TechnicalIndicators
from src.features.feature_engineering import FeatureEngineering
from src.features.label_generator import LabelGenerator
from src.data.merger import DataMerger
from src.preprocessing.splitter import DataSplitter
from src.models.train_xgboost import XGBoostTrainer
from src.evaluation.evaluate import ModelEvaluator

def main():

    # ---------------------------------------------------
    # Initialize Classes
    # ---------------------------------------------------

    loader = DataLoader()
    validator = DataValidator()
    cleaner = DataCleaner()
    indicator = TechnicalIndicators()
    engineer = FeatureEngineering()
    label_generator = LabelGenerator()
    merger = DataMerger()
    splitter = DataSplitter()
    trainer = XGBoostTrainer()
    evaluator = ModelEvaluator()

    # ---------------------------------------------------
    # Load Raw Dataset
    # ---------------------------------------------------

    print("=" * 70)
    print("STEP 1 : LOADING DATASETS")
    print("=" * 70)

    stocks = loader.load_all_stocks()

    # ---------------------------------------------------
    # Validate Dataset
    # ---------------------------------------------------

    print("\n")
    print("=" * 70)
    print("STEP 2 : VALIDATING DATASETS")
    print("=" * 70)

    for stock_name, dataframe in stocks.items():

        result = validator.validate(stock_name, dataframe)

        print(
            f"{stock_name:<20}"
            f"Status : {result['Status']:<10}"
            f"Rows : {result['Rows']}"
        )

    validator.save_report()

    # ---------------------------------------------------
    # Clean Dataset
    # ---------------------------------------------------

    print("\n")
    print("=" * 70)
    print("STEP 3 : CLEANING DATASETS")
    print("=" * 70)

    cleaned_stocks = {}

    for stock_name, dataframe in stocks.items():

        clean_df = cleaner.clean(stock_name, dataframe)

        cleaner.save(stock_name, clean_df)

        cleaned_stocks[stock_name] = clean_df

        print(f"[OK] Cleaned : {stock_name}")

    print("\nCleaning Completed Successfully")

    # ---------------------------------------------------
    # Generate Technical Indicators
    # ---------------------------------------------------

    print("\n")
    print("=" * 70)
    print("STEP 4 : GENERATING TECHNICAL INDICATORS")
    print("=" * 70)

    featured_stocks = {}

    for stock_name, dataframe in cleaned_stocks.items():

        feature_df = indicator.generate(dataframe)

        if feature_df.empty:
            print(f"[SKIP] Insufficient data : {stock_name}")
            continue

        featured_stocks[stock_name] = feature_df

        print(f"[OK] Indicators Generated : {stock_name}")

    # ---------------------------------------------------
    # Feature Engineering
    # ---------------------------------------------------
    print("\n")
    print("=" * 70)
    print("STEP 5 : FEATURE ENGINEERING")
    print("=" * 70)

    engineered_stocks = {}

    for stock_name, dataframe in featured_stocks.items():
        engineered_df = engineer.generate(dataframe, stock_name=stock_name)

        if engineered_df.empty:
            continue

        engineered_stocks[stock_name] = engineered_df

        print(f"[OK] Features Created : {stock_name}")

    print("\n")
    print("=" * 70)
    print("STEP 6 : LABEL GENERATION")
    print("=" * 70)

    labeled_stocks = {}

    for stock_name, dataframe in engineered_stocks.items():
        labeled_df = label_generator.generate(dataframe)

        if labeled_df.empty:
            continue

        labeled_stocks[stock_name] = labeled_df

        print(f"[OK] Labels Generated : {stock_name}")

    print("\n")
    print("=" * 70)
    print("STEP 7 : MERGING DATASETS")
    print("=" * 70)

    training_dataset = merger.merge(labeled_stocks)

    merger.save(training_dataset)
    print(f"Total Rows : {len(training_dataset)}")


    print("\n")
    print("=" * 70)
    print("STEP 8 : TRAIN / TEST SPLIT")
    print("=" * 70)

    X_train, X_test, y_train, y_test = splitter.split()

    print(f"Training Samples : {len(X_train)}")
    print(f"Testing Samples  : {len(X_test)}")


    print("\n")
    print("=" * 70)
    print("STEP 9 : TRAINING XGBOOST")
    print("=" * 70)

    model = trainer.train(
        X_train,
        y_train
    )

    trainer.save(
        model
    )

    print("\n")
    print("=" * 70)
    print("STEP 10 : MODEL EVALUATION")
    print("=" * 70)

    evaluator.evaluate(
        model,
        X_test,
        y_test
    )
    


    # ---------------------------------------------------
    # Summary
    # ---------------------------------------------------

    print("\n")
    print("=" * 70)
    print("PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 70)

    print(f"Stocks Loaded      : {len(stocks)}")
    print(f"Stocks Cleaned     : {len(cleaned_stocks)}")
    print(f"Features Generated : {len(featured_stocks)}")
    print(f"Engineered Datasets : {len(engineered_stocks)}")
    print(f"Labeled Datasets   : {len(labeled_stocks)}")

    print("=" * 70)


if __name__ == "__main__":
    main()
