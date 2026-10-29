import argparse
import sys
from pathlib import Path
import pandas as pd

from src.data.cleaner import DataCleaner
from src.features.indicators import TechnicalIndicators
from src.features.feature_engineering import FeatureEngineering
from src.models.predictor import StockPredictor
from src.models.risk_management import create_trade_plan
from src.utils.constants import SCRIP_DIR, CLEANED_DATA_DIR


def predict_stock_signal(dataframe: pd.DataFrame, stock_name: str = "INPUT_STOCK", detailed: bool = True) -> dict:
    """
    Processes a raw or cleaned stock DataFrame and returns honest prediction results.
    
    Args:
        dataframe: Stock OHLCV data
        stock_name: Symbol name for identification
        detailed: If True, include detailed risk assessment
        
    Returns:
        Dictionary with prediction, confidence, and quality metrics
    """
    cleaner = DataCleaner()
    indicator = TechnicalIndicators()
    engineer = FeatureEngineering()

    # Step 1: Clean data
    df_clean = cleaner.clean(stock_name, dataframe)

    if df_clean.empty or len(df_clean) < 50:
        raise ValueError("Insufficient data rows to generate indicators and features.")

    # Step 2: Generate technical indicators
    df_indicators = indicator.generate(df_clean)

    # Step 3: Feature engineering
    df_features = engineer.generate(df_indicators, stock_name=stock_name)

    if df_features.empty:
        raise ValueError("Feature engineering produced an empty dataset.")

    # Step 4: Predict on latest data point with honest reporting
    predictor = StockPredictor(honest_mode=True)
    latest_row = df_features.iloc[[-1]]
    
    if detailed:
        result = predictor.predict_with_risk_assessment(latest_row)
    else:
        result = predictor.predict(latest_row, return_all_probs=True)

    # Attach latest row date if available
    if "Date" in df_features.columns:
        result["date"] = str(df_features["Date"].iloc[-1])
    elif "Date" in df_clean.columns:
        result["date"] = str(df_clean["Date"].iloc[-1])

    return result


def main():
    parser = argparse.ArgumentParser(description="RupeeMind Stock Market Prediction CLI - Improved with Honest Reporting")
    parser.add_argument("--stock", type=str, help="Stock symbol name (e.g. 20MICRONS)")
    parser.add_argument("--csv", type=str, help="Path to raw stock CSV file")
    parser.add_argument("--detailed", action="store_true", help="Show detailed risk assessment")
    parser.add_argument("--trade-plan", action="store_true", help="Generate complete trade plan with risk management")
    parser.add_argument("--account-size", type=float, default=100000.0, help="Account size for position sizing")

    args = parser.parse_args()

    csv_path = None

    if args.csv:
        csv_path = Path(args.csv)
    elif args.stock:
        # Check SCRIP or CLEANED_DATA directory
        raw_path = SCRIP_DIR / f"{args.stock.upper()}.csv"
        cleaned_path = CLEANED_DATA_DIR / f"{args.stock.upper()}.csv"

        if raw_path.exists():
            csv_path = raw_path
        elif cleaned_path.exists():
            csv_path = cleaned_path
        else:
            print(f"Error: Stock file for '{args.stock}' not found in {SCRIP_DIR} or {CLEANED_DATA_DIR}")
            sys.exit(1)
    else:
        # Fallback to first available stock CSV file
        available_stocks = list(SCRIP_DIR.glob("*.csv"))
        if available_stocks:
            csv_path = available_stocks[0]
            print(f"No stock specified. Using default available file: {csv_path.name}")
        else:
            print("Error: No stock files found in data/raw/SCRIP/. Please provide --csv or --stock.")
            sys.exit(1)

    print("=" * 70)
    print("RUPEEMIND ML - IMPROVED STOCK PREDICTION (HONEST MODE)")
    print("=" * 70)
    print(f"Loading data from: {csv_path}")

    try:
        df = pd.read_csv(csv_path)
        result = predict_stock_signal(df, stock_name=csv_path.stem, detailed=args.detailed)

        print("\n" + "-" * 70)
        print(f"Stock Symbol    : {csv_path.stem.upper()}")
        if "date" in result:
            print(f"Latest Date     : {result['date']}")
        print(f"\nPrediction      : {result['prediction']}")
        print(f"Confidence      : {result['confidence']}%")
        print(f"Signal Strength : {result['signal_strength']}")
        
        # Show quality metrics
        if "quality_metrics" in result:
            print(f"\n--- Quality Metrics ---")
            qm = result["quality_metrics"]
            print(f"Certainty Score : {qm['certainty_score']}/100")
            print(f"Prediction Margin: {qm['prediction_margin']}%")
            print(f"Entropy         : {qm['entropy']} (lower = more certain)")
        
        # Show all probabilities
        if "all_probabilities" in result:
            print(f"\n--- All Class Probabilities ---")
            for class_name, prob in result["all_probabilities"].items():
                print(f"{class_name:10s} : {prob:6.2f}%")
        
        # Show recommendation
        if "recommendation" in result:
            print(f"\n--- Recommendation ---")
            print(f"{result['recommendation']}")
        
        # Show risk assessment if detailed mode
        if "risk_assessment" in result:
            print(f"\n--- Risk Assessment ---")
            ra = result["risk_assessment"]
            print(f"Risk Level      : {ra['risk_level']}")
            print(f"Warning         : {ra['warning']}")
            print(f"\nDisclaimer: {ra['disclaimer']}")
        
        # Generate trade plan if requested
        if args.trade_plan:
            print(f"\n" + "=" * 70)
            print("TRADE PLAN WITH RISK MANAGEMENT")
            print("=" * 70)
            
            # Get current price (latest close)
            current_price = df['Close'].iloc[-1]
            
            # Get ATR if available in features
            atr = df['ATR'].iloc[-1] if 'ATR' in df.columns else None
            
            trade_plan = create_trade_plan(
                symbol=csv_path.stem.upper(),
                prediction_result=result,
                current_price=current_price,
                account_size=args.account_size,
                atr=atr
            )
            
            if trade_plan['signal'] == 'HOLD':
                print(f"\n{trade_plan['recommendation']}")
            else:
                print(f"\n--- Entry Strategy ---")
                print(f"Entry Price     : ₹{trade_plan['entry_price']}")
                print(f"Stop Loss       : ₹{trade_plan['stop_loss']}")
                print(f"Take Profit     : ₹{trade_plan['take_profit']}")
                
                print(f"\n--- Position Sizing ---")
                ps = trade_plan['position_size']
                print(f"Shares          : {ps['shares']}")
                print(f"Position Value  : ₹{ps['value']:,.2f}")
                print(f"% of Portfolio  : {ps['percentage_of_portfolio']}%")
                
                print(f"\n--- Risk Metrics ---")
                rm = trade_plan['risk_metrics']
                print(f"Risk Amount     : ₹{rm['risk_amount']:,.2f}")
                print(f"Risk %          : {rm['risk_percentage']}%")
                print(f"Risk:Reward     : 1:{rm['risk_reward_ratio']}")
                print(f"Stop Distance   : {rm['stop_distance_pct']}%")
                
                print(f"\n--- Risk Assessment ---")
                ra = trade_plan['risk_assessment']
                print(f"Risk Score      : {ra['risk_score']}/100")
                print(f"Risk Level      : {ra['risk_level']}")
                print(f"Recommendation  : {ra['recommendation']}")
                
                print(f"\n--- Warnings ---")
                for warning in trade_plan['warnings']:
                    print(f"  {warning}")
        
        print("-" * 70)
        print("\n[OK] Prediction completed successfully.")
        print("\nIMPORTANT: These probabilities are based on historical patterns.")
        print("Always use proper risk management and never invest more than you can afford to lose.")

    except Exception as e:
        print(f"\nError during prediction: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
