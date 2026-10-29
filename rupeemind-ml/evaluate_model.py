"""
Script to evaluate the trained model with comprehensive metrics and backtesting.
"""
import sys
import pandas as pd
import joblib
from pathlib import Path

from src.evaluation.enhanced_evaluate import EnhancedModelEvaluator
from src.utils.constants import SAVED_MODELS_DIR, FINAL_DATA_DIR


def load_test_data():
    """Load or create test dataset."""
    # Check if there's a separate test set
    test_path = FINAL_DATA_DIR / "test_dataset.csv"
    
    if test_path.exists():
        print(f"Loading test data from {test_path}")
        df = pd.read_csv(test_path)
    else:
        # Load training dataset and create a holdout test set
        train_path = FINAL_DATA_DIR / "training_dataset.csv"
        if not train_path.exists():
            print(f"Error: Training dataset not found at {train_path}")
            print("Please run training pipeline first: python train.py")
            sys.exit(1)
        
        print(f"Loading training data from {train_path}")
        df = pd.read_csv(train_path)
        
        # Use the last 20% as test set (time-series split)
        split_idx = int(len(df) * 0.8)
        df = df.iloc[split_idx:].reset_index(drop=True)
        print(f"Using last 20% of training data as test set ({len(df)} samples)")
    
    return df


def main():
    print("=" * 70)
    print("RUPEEMIND ML - ENHANCED MODEL EVALUATION")
    print("=" * 70)
    
    # Load model artifacts
    model_path = SAVED_MODELS_DIR / "xgboost_model.pkl"
    encoder_path = SAVED_MODELS_DIR / "label_encoder.pkl"
    features_path = SAVED_MODELS_DIR / "feature_columns.pkl"
    
    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        print("Please train the model first: python train.py")
        sys.exit(1)
    
    print("\nLoading model artifacts...")
    model = joblib.load(model_path)
    label_encoder = joblib.load(encoder_path)
    feature_columns = joblib.load(features_path)
    
    print(f"✓ Model loaded: {type(model).__name__}")
    print(f"✓ Classes: {label_encoder.classes_}")
    print(f"✓ Features: {len(feature_columns)}")
    
    # Load test data
    print("\nLoading test data...")
    test_df = load_test_data()
    
    # Check if Target column exists
    if 'Target' not in test_df.columns:
        print("Error: 'Target' column not found in test data")
        sys.exit(1)
    
    # Separate features and target
    y_test = test_df['Target']
    
    # Get only the feature columns that the model was trained on
    available_features = [col for col in feature_columns if col in test_df.columns]
    missing_features = [col for col in feature_columns if col not in test_df.columns]
    
    if missing_features:
        print(f"\n⚠ Warning: {len(missing_features)} features missing from test data")
        print(f"First few missing: {missing_features[:5]}")
    
    X_test = test_df[available_features]
    
    print(f"\nTest set size: {len(X_test)} samples")
    print(f"Features available: {len(available_features)}/{len(feature_columns)}")
    print(f"Class distribution:")
    for class_name in label_encoder.classes_:
        class_idx = list(label_encoder.classes_).index(class_name)
        count = sum(y_test == class_idx)
        pct = count / len(y_test) * 100
        print(f"  {class_name}: {count} ({pct:.1f}%)")
    
    # Initialize evaluator
    evaluator = EnhancedModelEvaluator(report_directory="reports")
    
    # Run comprehensive evaluation
    print("\n" + "=" * 70)
    print("Running comprehensive evaluation...")
    print("=" * 70)
    
    results = evaluator.evaluate_comprehensive(
        model=model,
        X_test=X_test,
        y_test=y_test,
        label_encoder=label_encoder,
        feature_names=available_features
    )
    
    # Run backtest if we have date and price information
    if 'Date' in test_df.columns and 'Close' in test_df.columns:
        print("\n" + "=" * 70)
        print("Running backtest simulation...")
        print("=" * 70)
        
        try:
            backtest_results = evaluator.backtest_trading_strategy(
                model=model,
                X_test=X_test,
                y_test=y_test,
                test_data=test_df,
                initial_capital=100000.0,
                position_size=0.1,
                transaction_cost=0.001
            )
        except Exception as e:
            print(f"⚠ Backtest failed: {e}")
    else:
        print("\n⚠ Skipping backtest: Date or Close columns not found in test data")
    
    # Print summary
    print("\n" + "=" * 70)
    print("EVALUATION COMPLETE")
    print("=" * 70)
    print("\nReports generated in 'reports/' directory:")
    print("  - reports/metrics/classification_report.txt")
    print("  - reports/metrics/evaluation_metrics.txt")
    print("  - reports/metrics/feature_importance.csv")
    print("  - reports/plots/confusion_matrix.png")
    print("  - reports/plots/probability_distributions.png")
    print("  - reports/plots/feature_importance.png")
    
    if 'Date' in test_df.columns and 'Close' in test_df.columns:
        print("  - reports/backtests/backtest_results.txt")
    
    print("\n" + "=" * 70)
    print("KEY INSIGHTS")
    print("=" * 70)
    
    overall = results["overall_metrics"]
    
    print(f"\n✓ Overall Accuracy: {overall['accuracy']:.2%}")
    print(f"✓ Average Model Confidence: {overall['avg_confidence']:.2%}")
    print(f"✓ High Confidence Predictions (>50%): {overall['high_confidence_rate']:.2%}")
    
    if overall['accuracy'] < 0.4:
        print("\n⚠ WARNING: Low accuracy suggests model may not be better than random guessing")
        print("Consider:")
        print("  - Adding more features")
        print("  - Collecting more training data")
        print("  - Trying different model architectures")
        print("  - Adjusting class balance")
    elif overall['accuracy'] < 0.6:
        print("\n⚠ Moderate accuracy. Model shows some predictive power but needs improvement.")
    else:
        print("\n✓ Good accuracy. Model shows reasonable predictive power.")
    
    if overall['avg_confidence'] < 0.5:
        print("\n⚠ Low average confidence suggests high uncertainty in predictions")
    
    print("\n" + "=" * 70)
    print("IMPORTANT DISCLAIMER")
    print("=" * 70)
    print("These metrics show historical performance on test data.")
    print("Past performance does NOT guarantee future results.")
    print("Stock market prediction is inherently uncertain.")
    print("Always use proper risk management and never invest more than you can afford to lose.")
    print("=" * 70)


if __name__ == "__main__":
    main()
